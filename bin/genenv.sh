#!/bin/sh

genid() {
  openssl rand -base64 32 | shasum | cut -d " " -f1
}

if [ ! -f ./.env ]; then

  echo "Generating .env file..."

  read -p "Enter SITE_NAME (ex. My Project): " SITE_NAME
  read -p "Enter DOMAIN_NAME (ex. myproject.com): " DOMAIN_NAME
  read -p "Enter PROJECT_PREFIX (ex. mp): " PROJECT_PREFIX
  read -p "Enter TAILSCALE_TAILNET (ex. tail1a2b3c.ts.net): " TAILSCALE_TAILNET
  read -p "Enter DEPLOYMENT_LOCATION (local/hetzner/aws): " DEPLOYMENT_LOCATION
  read -p "Enter DEPLOYMENT_METHOD (compose/kubernetes): " DEPLOYMENT_METHOD
  read -p "Enter CONFIGURE_NAMESERVERS (y/n): " CONFIGURE_NAMESERVERS
  read -p "Enter PROJECT_REPO (Leave blank for default): " PROJECT_REPO
  read -p "Enter CLOUD_INIT_LOCATION (Leave blank for default): " CLOUD_INIT_LOCATION

  cat << EOF > ./.env
SITE_NAME=$SITE_NAME
PROJECT_PREFIX=$PROJECT_PREFIX
TAILSCALE_TAILNET=$TAILSCALE_TAILNET

PROJECT_REPO=${PROJECT_REPO:-"https://github.com/jcmccormick/wc.git"}
CLOUD_INIT_LOCATION=${CLOUD_INIT_LOCATION:-"https://gist.githubusercontent.com/jcmccormick/820ad1cf61df4650825a00ea275edfa0/raw/9cafe1b26c400307bb5ad4788cf07a70b37f5261/gistfile1.txt"}
WIZAPP_VERSION=${WIZAPP_VERSION:-"0.2.0-beta.2"}

DEPLOYMENT_LOCATION=$DEPLOYMENT_LOCATION
DEPLOYMENT_METHOD=$DEPLOYMENT_METHOD
CONFIGURE_NAMESERVERS=$CONFIGURE_NAMESERVERS

DOMAIN_NAME=$DOMAIN_NAME
CUST_APP_HOSTNAME=app.$DOMAIN_NAME
CUST_LAND_HOSTNAME=www.$DOMAIN_NAME

REDIS_PASS=$(genid)

PG_DB=$PROJECT_PREFIX-db-$(genid)
PG_USER=$PROJECT_PREFIX-postgres-$(genid)
PG_PASS=$(genid)

API_COOKIE=$(genid)

KC_ADMIN=$PROJECT_PREFIX-auth-$(genid)
KC_PASS=$(genid)
KC_REALM=kc-realm
KC_CLIENT=kc-client
KC_API_CLIENT_ID=kc-api-client-id
KC_API_CLIENT_SECRET=kc-api-client-secret

SOCK_SECRET=$(genid)

GRAYLOG_ROOT_PASSWORD_SHA2=$(echo -n "${PROJECT_PREFIX}changeme1" | sha256sum | cut -d " " -f1)
GRAYLOG_PASSWORD_SECRET=$(genid)

EOF
  # Local deployments should specify existing tailscale ips and the operator
  if [ $DEPLOYMENT_LOCATION = "local" ]; then
    echo "In a local deployment, you need to provide information for existing servers that you control. The machines should be ssh accessible using the Tailscale operator account. The host names should be accessible on the tailnet you provided earlier. Only provide the machine name, for example 'db.tailnet.ts.net' would yield 'db'."

    cat << EOF >> ./.env
TAILSCALE_OPERATOR=${TAILSCALE_OPERATOR:-$(read -p "Enter TAILSCALE_OPERATOR: " var; echo "$var")}

BUILD_HOST=${BUILD_HOST:-$(read -p "Enter BUILD_HOST: " var; echo "$var";)}
EXIT_HOST=${EXIT_HOST:-$(read -p "Enter EXIT_HOST: " var; echo "$var";)}
APP_HOST=${APP_HOST:-$(read -p "Enter APP_HOST: " var; echo "$var";)}
DB_HOST=${DB_HOST:-$(read -p "Enter DB_HOST: " var; echo "$var";)}
SVC_HOST=${SVC_HOST:-$(read -p "Enter SVC_HOST: " var; echo "$var";)}

EOF

    if [ $CONFIGURE_NAMESERVERS = "y" ]; then
      echo "In order to configure nameservers, provide host names and public IPv4 addresses for two name servers, and the public IPv4 of the Tailscale exit node. Bind9 will be installed and configured on the name servers; Nginx will be installed on the exit server."
      cat << EOF >> ./.env
NS1_HOST=${NS1_HOST:-$(read -p "Enter NS1_HOST: " var; echo "$var";)}
NS1_PUBLIC_IP=${NS1_PUBLIC_IP:-$(read -p "Enter NS1_PUBLIC_IP: " var; echo "$var";)}
NS2_HOST=${NS2_HOST:-$(read -p "Enter NS2_HOST: " var; echo "$var";)}
NS2_PUBLIC_IP=${NS2_PUBLIC_IP:-$(read -p "Enter NS2_PUBLIC_IP: " var; echo "$var";)}
EXIT_PUBLIC_IP=${EXIT_PUBLIC_IP:-$(read -p "Enter EXIT_PUBLIC_IP: " var; echo "$var";)}

EOF
    fi

  elif [ $DEPLOYMENT_LOCATION = "aws" ]; then
    cat << EOF >> ./.env
AWS_AMI_ID=${AWS_AMI_ID:-$(read -p "Enter AWS_AMI_ID: " var; echo ${var:-"aws-ami-id"})}
AWS_INSTANCE_TYPE=${AWS_INSTANCE_TYPE:-$(read -p "Enter AWS_INSTANCE_TYPE: " var; echo ${var:-"aws-instance-type"})}
AWS_KEY_NAME=${AWS_KEY_NAME:-$(read -p "Enter AWS_KEY_NAME: " var; echo ${var:-"aws-key-name"})}

EOF
  elif [ $DEPLOYMENT_LOCATION = "hetzner" ]; then
    cat << EOF >> ./.env
HETZNER_DATACENTER=${HETZNER_DATACENTER:-$(read -p "Enter HETZNER_DATACENTER (Leave blank for default): " var; echo ${var:-"hil-dc1"})}
HETZNER_TYPE=${HETZNER_TYPE:-$(read -p "Enter HETZNER_TYPE (Leave blank for default): " var; echo ${var:-"cpx11"})}
HETZNER_IMAGE=${HETZNER_IMAGE:-$(read -p "Enter HETZNER_IMAGE (Leave blank for default): " var; echo ${var:-"ubuntu-22.04"})}

EOF
  fi

  if [ ! $DEPLOYMENT_LOCATION = "local" ]; then
    cat << EOF >> ./.env
TAILSCALE_OPERATOR=${PROJECT_PREFIX}oper
BUILD_HOST=$PROJECT_PREFIX-build.$TAILSCALE_TAILNET
EXIT_HOST=$PROJECT_PREFIX-exit.$TAILSCALE_TAILNET
APP_HOST=$PROJECT_PREFIX-app.$TAILSCALE_TAILNET
DB_HOST=$PROJECT_PREFIX-db.$TAILSCALE_TAILNET
SVC_HOST=$PROJECT_PREFIX-svc.$TAILSCALE_TAILNET

EOF
  fi

  echo ".env file generated successfully!"

else

  echo "Using existing env file"

fi