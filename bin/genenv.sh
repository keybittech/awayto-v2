#!/bin/sh

genid() {
  openssl rand -base64 32 | shasum | cut -d " " -f1
}

prompt_user() {
  var_name="$1"
  prompt_msg="$2"
  default_value="$3"

  while true; do
    printf "%s" "$prompt_msg"
    read input
    if [ -n "$input" ]; then
      eval "$var_name=\"$input\""
      break
    elif [ -n "$default_value" ]; then
      eval "$var_name=\"$default_value\""
      break
    fi
  done
}

if [ ! -f ./.env ]; then

  echo "Generating .env file..."

  echo "All of the following are required."
  prompt_user "SITE_NAME" "Enter SITE_NAME (ex. My Project): "
  prompt_user "DOMAIN_NAME" "Enter DOMAIN_NAME (ex. myproject.com): "
  prompt_user "PROJECT_PREFIX" "Enter PROJECT_PREFIX (ex. mp): "
  prompt_user "DEPLOYMENT_LOCATION" "Enter DEPLOYMENT_LOCATION (local/hetzner/aws): "
  prompt_user "DEPLOYMENT_METHOD" "Enter DEPLOYMENT_METHOD (compose/kubernetes): "
  prompt_user "CONFIGURE_NAMESERVERS" "Enter CONFIGURE_NAMESERVERS (y/n): "
  prompt_user "ADMIN_EMAIL" "Enter ADMIN_EMAIL: "
  prompt_user "PROJECT_REPO" "Enter PROJECT_REPO (Leave blank for default): " "https://github.com/jcmccormick/wc.git"
  prompt_user "CLOUD_INIT_LOCATION" "Enter CLOUD_INIT_LOCATION (Leave blank for default): " "https://gist.githubusercontent.com/jcmccormick/820ad1cf61df4650825a00ea275edfa0/raw/9cafe1b26c400307bb5ad4788cf07a70b37f5261/gistfile1.txt"

  cat << EOF > ./.env
SITE_NAME=$SITE_NAME
PROJECT_PREFIX=$PROJECT_PREFIX

PROJECT_REPO=$PROJECT_REPO
CLOUD_INIT_LOCATION=$CLOUD_INIT_LOCATION
WIZAPP_VERSION=${WIZAPP_VERSION:-"0.2.0-beta.2"}

DEPLOYMENT_LOCATION=$DEPLOYMENT_LOCATION
DEPLOYMENT_METHOD=$DEPLOYMENT_METHOD
CONFIGURE_NAMESERVERS=$CONFIGURE_NAMESERVERS
ADMIN_EMAIL=$ADMIN_EMAIL

DOMAIN_NAME=$DOMAIN_NAME
CUST_APP_HOSTNAME=www.$DOMAIN_NAME
CUST_LAND_HOSTNAME=www.$DOMAIN_NAME

CA_PASS=$(genid)

REDIS_PASS=$(genid)

PG_DB=$PROJECT_PREFIX-db-$(genid)
PG_USER=$PROJECT_PREFIX-postgres-$(genid)
PG_PASS=$(genid)

API_COOKIE=$(genid)

KC_ADMIN=$PROJECT_PREFIX-auth-$(genid)
KC_PASS=$(genid)
KC_REALM=$PROJECT_PREFIX-realm
KC_CLIENT=$PROJECT_PREFIX-client
KC_API_CLIENT_ID=$PROJECT_PREFIX-api-client
KC_API_CLIENT_SECRET=$(genid)

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
BUILD_HOST=$PROJECT_PREFIX-build
EXIT_HOST=$PROJECT_PREFIX-exit
APP_HOST=$PROJECT_PREFIX-app
DB_HOST=$PROJECT_PREFIX-db
SVC_HOST=$PROJECT_PREFIX-svc
NS1_HOST=$PROJECT_PREFIX-ns1
NS2_HOST=$PROJECT_PREFIX-ns2

EOF
  fi

  echo ".env file generated successfully!"

else

  echo "Using existing env file"
  sed -i '/# Server Listings/,/^$/d' ./.env

fi