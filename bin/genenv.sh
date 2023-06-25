#!/bin/sh

genid() {
  openssl rand -base64 32 | shasum | cut -d " " -f1
}

if [ ! -f ./.env ]; then

  echo "Generating .env file..."

  read -p "Enter SITE_NAME (ex. My Project): " site_name
  read -p "Enter DOMAIN_NAME (ex. myproject.com): " domain_name
  read -p "Enter PROJECT_PREFIX (ex. mp): " project_prefix
  read -p "Enter DEPLOYMENT_LOCATION (local/hetzner/aws): " deployment_location
  read -p "Enter DEPLOYMENT_METHOD (compose/kubernetes): " deployment_method
  read -p "Enter DEPLOY_NAMESERVERS (y/n): " deploy_nameservers

  cat << EOF > ./.env
SITE_NAME=$site_name
PROJECT_PREFIX=$project_prefix
DEPLOYMENT_METHOD=$deployment_method
DEPLOYMENT_LOCATION=$deployment_location
DEPLOY_NAMESERVERS=$deploy_nameservers
WIZAPP_VERSION=${WIZAPP_VERSION:-"0.2.0-beta.2"}

CUST_APP_HOSTNAME=app.$domain_name
CUST_LAND_HOSTNAME=www.$domain_name

REDIS_USER=$project_prefix-redis-$(genid)
REDIS_PASS=$(genid)

PG_DB=$project_prefix-db-$(genid)
PG_USER=$project_prefix-postgres-$(genid)
PG_PASS=$(genid)

API_COOKIE=$(genid)

KC_ADMIN=$project_prefix-auth-$(genid)
KC_PASS=$(genid)
KC_REALM=kc-realm
KC_CLIENT=kc-client
KC_API_CLIENT_ID=kc-api-client-id
KC_API_CLIENT_SECRET=kc-api-client-secret

SOCK_SECRET=$(genid)

GRAYLOG_ROOT_PASSWORD_SHA2=$(echo -n "${project_prefix}changeme1" | sha256sum | cut -d " " -f1)
GRAYLOG_PASSWORD_SECRET=$(genid)

EOF
  # Local deployments should specify existing tailscale ips and the operator
  if [ $deployment_location = "local" ]; then


    if [ $deploy_nameservers = "y" ]; then
      cat << EOF >> ./.env
NS1_TAILSCALE_IPV4=${NS1_TAILSCALE_IPV4:-$(read -p "Enter NS1_TAILSCALE_IPV4: " var; echo "$var";)}
NS1_REAL_IP=${NS1_REAL_IP:-$(read -p "Enter NS1_REAL_IP: " var; echo "$var";)}
NS2_TAILSCALE_IPV4=${NS2_TAILSCALE_IPV4:-$(read -p "Enter NS2_TAILSCALE_IPV4: " var; echo "$var";)}
NS2_REAL_IP=${NS2_REAL_IP:-$(read -p "Enter NS2_REAL_IP: " var; echo "$var";)}

EOF
    fi

    cat << EOF >> ./.env
TAILSCALE_OPERATOR=${TAILSCALE_OPERATOR:-$(read -p "Enter TAILSCALE_OPERATOR: " var; echo ${var:-"ts-operator"})}

EXIT_TAILSCALE_IPV4=${EXIT_TAILSCALE_IPV4:-$(read -p "Enter EXIT_TAILSCALE_IPV4: " var; echo "$var";)}
EXIT_REAL_IP=${EXIT_REAL_IP:-$(read -p "Enter EXIT_REAL_IP: " var; echo "$var";)}
APP_TAILSCALE_IPV4=${APP_TAILSCALE_IPV4:-$(read -p "Enter APP_TAILSCALE_IPV4: " var; echo "$var";)}
DB_TAILSCALE_IPV4=${DB_TAILSCALE_IPV4:-$(read -p "Enter DB_TAILSCALE_IPV4: " var; echo "$var";)}
SVC_TAILSCALE_IPV4=${SVC_TAILSCALE_IPV4:-$(read -p "Enter SVC_TAILSCALE_IPV4: " var; echo "$var";)}

EOF

  elif [ $deployment_location = "aws" ]; then
    cat << EOF >> ./.env
TAILSCALE_OPERATOR=${project_prefix}oper

AWS_AMI_ID=${AWS_AMI_ID:-$(read -p "Enter AWS_AMI_ID: " var; echo ${var:-"aws-ami-id"})}
AWS_INSTANCE_TYPE=${AWS_INSTANCE_TYPE:-$(read -p "Enter AWS_INSTANCE_TYPE: " var; echo ${var:-"aws-instance-type"})}
AWS_KEY_NAME=${AWS_KEY_NAME:-$(read -p "Enter AWS_KEY_NAME: " var; echo ${var:-"aws-key-name"})}

EOF
  elif [ $deployment_location = "hetzner" ]; then
    cat << EOF >> ./.env
HETZNER_DATACENTER=${HETZNER_DATACENTER:-$(read -p "Enter HETZNER_DATACENTER: " var; echo ${var:-"hil-dc1"})}
HETZNER_TYPE=${HETZNER_TYPE:-$(read -p "Enter HETZNER_TYPE: " var; echo ${var:-"cpx11"})}
HETZNER_IMAGE=${HETZNER_IMAGE:-$(read -p "Enter HETZNER_IMAGE: " var; echo ${var:-"ubuntu-22.04"})}

EOF
  fi

  echo ".env file generated successfully!"

  # # testing
  # cat .env
  # rm .env

else

  echo "Using existing env file"

fi

# testing
. ./.env