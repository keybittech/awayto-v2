#!/bin/sh

. ./bin/genenv.sh

mkdir -p deployed

TIMESTAMP=$(date +%Y%m%d)

exit 1

# If not local, we need to deploy new servers on a cloud provider
if [ ! "$DEPLOYMENT_LOCATION" = "local" ]; then

  # Check if all required options are set
  . ./bin/getopts.sh ts-auth-key
  if [ -z "$TAILSCALE_AUTH_KEY" ]; then
    echo "Non-local deployments require --ts-auth-key. Or, export TAILSCALE_AUTH_KEY." >&2
    exit 1
  fi

  if [ "$DEPLOYMENT_LOCATION" = "aws" ]; then
    # Check if aws is installed
    if ! command -v aws >/dev/null 2>&1; then
      echo "'aws' command line tool is required but not installed. Please install it and retry."
      exit 1
    fi

    # aws ec2 run-instances --image-id $AWS_AMI_ID --count 1 --instance-type $AWS_INSTANCE_TYPE --key-name $AWS_KEY_NAME --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value='$SECRETAILSCALE_SERVER_NAME'}]' 
  elif [ "$DEPLOYMENT_LOCATION" = "hetzner" ]; then
    date >> ./deployed/$PROJECT_PREFIX/hetzner

    # Check if hcloud is installed
    if ! command -v hcloud >/dev/null 2>&1; then
      echo "'hcloud' command line tool is required but not installed. Please install it and retry."
      exit 1
    fi

    # Validate required params
    echo "Datacenter ${HETZNER_DATACENTER:?'missing in .env'}"
    echo "Type ${HETZNER_TYPE:?'missing in .env'}"
    echo "Image ${HETZNER_IMAGE:?'missing in .env'}"

    # Create tailscale firewall
    hcloud firewall create --name $PROJECT_PREFIX-ts-firewall --rules-file ./deploy/hetzner/ts-firewall.json

    # Configure the cloud-config file for first-run deployment
    echo "# Configure the cloud-config file for first-run deployment"
    sed "s/dummyuser/$TAILSCALE_OPERATOR/g; s/ts-auth-key/$TAILSCALE_AUTH_KEY/g" ./deploy/cloud-config.yaml.template > ./deployed/$PROJECT_PREFIX/cloud-config.yaml

    if [ "$DEPLOY_NAMESERVERS" = "y" ]; then
      # Create ns firewall
      hcloud firewall create --name $PROJECT_PREFIX-ns-firewall --rules-file ./deploy/hetzner/ns-firewall.json

      # Create nameservers
      hcloud server create --name $PROJECT_PREFIX-ns1 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-ns-firewall >/dev/null
      hcloud server create --name $PROJECT_PREFIX-ns2 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-ns-firewall >/dev/null

      hcloud firewall describe $PROJECT_PREFIX-ns-firewall -o json > ./deployed/$PROJECT_PREFIX/ns-firewall.json
      hcloud server describe $PROJECT_PREFIX-ns1 -o json > ./deployed/$PROJECT_PREFIX/ns1.json
      hcloud server describe $PROJECT_PREFIX-ns2 -o json > ./deployed/$PROJECT_PREFIX/ns2.json
      
      NS1_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-ns1 -o=format="{{.PublicNet.IPv4.IP}}")
      NS2_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-ns2 -o=format="{{.PublicNet.IPv4.IP}}")
    fi

    # Create public firewall
    hcloud firewall create --name $PROJECT_PREFIX-public-firewall --rules-file ./deploy/hetzner/public-firewall.json

    # Create exit node
    hcloud server create --name $PROJECT_PREFIX-exit --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-public-firewall >/dev/null

    # Create app, db, svc nodes
    hcloud server create --name $PROJECT_PREFIX-app --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --without-ipv4 --without-ipv6 >/dev/null
    hcloud server create --name $PROJECT_PREFIX-db --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --without-ipv4 --without-ipv6 >/dev/null
    hcloud server create --name $PROJECT_PREFIX-svc --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/$PROJECT_PREFIX/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --without-ipv4 --without-ipv6 >/dev/null

    # Describe resources
    hcloud firewall describe $PROJECT_PREFIX-ts-firewall -o json > ./deployed/$PROJECT_PREFIX/ts-firewall.json
    hcloud firewall describe $PROJECT_PREFIX-public-firewall -o json > ./deployed/$PROJECT_PREFIX/public-firewall.json

    hcloud server describe $PROJECT_PREFIX-exit -o json > ./deployed/$PROJECT_PREFIX/exit.json
    hcloud server describe $PROJECT_PREFIX-app -o json > ./deployed/$PROJECT_PREFIX/app.json
    hcloud server describe $PROJECT_PREFIX-db -o json > ./deployed/$PROJECT_PREFIX/db.json
    hcloud server describe $PROJECT_PREFIX-svc -o json > ./deployed/$PROJECT_PREFIX/svc.json

    EXIT_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-exit -o=format="{{.PublicNet.IPv4.IP}}")

  fi

  # Wait for tailscale attachments
  while [ -z "$SVC_TAILSCALE_IPV4" ]; do
    SVC_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-svc")
    if [ -z "$SVC_TAILSCALE_IPV4" ]; then
      echo "Waiting for $PROJECT_PREFIX-svc to become available..."
      sleep 5
    fi
  done

  while [ -z "$DB_TAILSCALE_IPV4" ]; do
    DB_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-db")
    if [ -z "$DB_TAILSCALE_IPV4" ]; then
      echo "Waiting for $PROJECT_PREFIX-db to become available..."
      sleep 5
    fi
  done

  while [ -z "$APP_TAILSCALE_IPV4" ]; do
    APP_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-app")
    if [ -z "$APP_TAILSCALE_IPV4" ]; then
      echo "Waiting for $PROJECT_PREFIX-app to become available..."
      sleep 5
    fi
  done

  while [ -z "$EXIT_TAILSCALE_IPV4" ]; do
    EXIT_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-exit")
    if [ -z "$EXIT_TAILSCALE_IPV4" ]; then
      echo "Waiting for $PROJECT_PREFIX-exit to become available..."
      sleep 5
    fi
  done

  if [ "$DEPLOY_NAMESERVERS" = "y" ]; then
    while [ -z "$NS1_TAILSCALE_IPV4" ]; do
      NS1_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-ns1")
      if [ -z "$NS1_TAILSCALE_IPV4" ]; then
        echo "Waiting for $PROJECT_PREFIX-ns1 to become available..."
        sleep 5
      fi
    done

    while [ -z "$NS2_TAILSCALE_IPV4" ]; do
      NS2_TAILSCALE_IPV4=$(tailscale ip -4 "$PROJECT_PREFIX-ns2")
      if [ -z "$NS2_TAILSCALE_IPV4" ]; then
        echo "Waiting for $PROJECT_PREFIX-ns2 to become available..."
        sleep 5
      fi
    done

    cat << EOF >> ./.env
# NAMESERVERS
NS1_TAILSCALE_IPV4=$NS1_TAILSCALE_IPV4
NS1_REAL_IP=$NS1_REAL_IP
NS2_TAILSCALE_IPV4=$NS2_TAILSCALE_IPV4
NS2_REAL_IP=$NS2_REAL_IP

EOF
  fi

  cat << EOF >> ./.env
# SERVERS
EXIT_TAILSCALE_IPV4=$EXIT_TAILSCALE_IPV4
EXIT_REAL_IP=$EXIT_REAL_IP
APP_TAILSCALE_IPV4=$APP_TAILSCALE_IPV4
DB_TAILSCALE_IPV4=$DB_TAILSCALE_IPV4
SVC_TAILSCALE_IPV4=$SVC_TAILSCALE_IPV4

EOF
fi

. ./bin/genexit.sh
. ./bin/genapp.sh
. ./bin/genns.sh

echo "------ POST INSTALLATION ------"

# Notify approver
echo "If you don't have Tailscale autoApprovers setup, go to the admin console and enable the exit node for $PROJECT_PREFIX-exit. Run the following command after."
echo "ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 \"sudo tailscale up --operator $TAILSCALE_OPERATOR --exit-node=$EXIT_TAILSCALE_IPV4 --ssh\""

if [ "$DEPLOY_NAMESERVERS" = "y" ]; then
  echo "You can now configure your registrar to point $DOMAIN_NAME to:\nns1: $NS1_REAL_IP\nns2: $NS2_REAL_IP"
  echo "When DNS propagation has resolved, enable certbot with the following:"
  echo "ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 \"sudo certbot --nginx -d $DOMAIN_NAME -m <your email> --agree-tos --no-eff-email --redirect\""
else
  read -p "Enter email configure with certbot" CERTBOT_EMAIL
  ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo certbot --nginx -d $DOMAIN_NAME -m $CERTBOT_EMAIL --agree-tos --no-eff-email --redirect"
fi



