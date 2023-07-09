#!/bin/sh

. ./bin/genenv.sh
. ./.env

mkdir -p "sites/$PROJECT_PREFIX"

TIMESTAMP=$(date +%Y%m%d)

# If not local, we need to deploy servers.
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
    date >> "./sites/$PROJECT_PREFIX/hetzner"

    # Check if hcloud is installed
    if ! command -v hcloud >/dev/null 2>&1; then
      echo "'hcloud' command line tool is required but not installed. Please install it and retry."
      exit 1
    fi

    # Configure the cloud-config file for first-run deployment
    echo "# Configure the cloud-config file for first-run deployment"
    sed "s#dummyuser#$TAILSCALE_OPERATOR#g; \
      s#cloud-init-location#$CLOUD_INIT_LOCATION#g; \
      s#ts-auth-key#$TAILSCALE_AUTH_KEY#g" ./deploy/cloud-config.yaml.template > "./sites/$PROJECT_PREFIX/cloud-config.yaml"
    
    # # Create private network
    # hcloud network create --name $PROJECT_PREFIX-network --ip-range 10.0.0.0/16
    # hcloud network add-subnet $PROJECT_PREFIX-network --type server --network-zone us-west --ip-range 10.0.1.0/24
    # hcloud network describe $PROJECT_PREFIX-network -o json > ./sites/$PROJECT_PREFIX/network.json

    # Create hetzner firewall for tailscale use
    hcloud firewall create --name "$PROJECT_PREFIX-ts-firewall" --rules-file ./deploy/hetzner/ts-firewall.json
    hcloud firewall describe "$PROJECT_PREFIX-ts-firewall" -o json > "./sites/$PROJECT_PREFIX/ts-firewall.json"


    # Create public firewall
    hcloud firewall create --name "$PROJECT_PREFIX-public-firewall" --rules-file ./deploy/hetzner/public-firewall.json
    hcloud firewall describe "$PROJECT_PREFIX-public-firewall" -o json > "./sites/$PROJECT_PREFIX/public-firewall.json"

    echo "# Generating exit server"

    # Create exit, app, db, svc, build machines
    hcloud server create --name "$PROJECT_PREFIX-exit" --datacenter "$HETZNER_DATACENTER" --type "$HETZNER_TYPE" --image "$HETZNER_IMAGE" --user-data-from-file "./sites/$PROJECT_PREFIX/cloud-config.yaml" --firewall "$PROJECT_PREFIX-ts-firewall" --firewall "$PROJECT_PREFIX-public-firewall" >/dev/null
    hcloud server describe "$PROJECT_PREFIX-exit" -o json > "./sites/$PROJECT_PREFIX/exit.json"

    for SERVER in app db svc build; do
      echo "# Generating $SERVER server"
      hcloud server create --name "$PROJECT_PREFIX-$SERVER" --datacenter "$HETZNER_DATACENTER" --type "$HETZNER_TYPE" --image "$HETZNER_IMAGE" --user-data-from-file "./sites/$PROJECT_PREFIX/cloud-config.yaml" --firewall "$PROJECT_PREFIX-ts-firewall" >/dev/null
      hcloud server describe "$PROJECT_PREFIX-$SERVER" -o json > "./sites/$PROJECT_PREFIX/$SERVER.json"
    done

    echo "# Servers generated"

    if [ "$CONFIGURE_NAMESERVERS" = "y" ]; then
      echo "# Generating nameservers"

      # Create ns firewall
      hcloud firewall create --name "$PROJECT_PREFIX-ns-firewall" --rules-file ./deploy/hetzner/ns-firewall.json
      hcloud firewall describe "$PROJECT_PREFIX-ns-firewall" -o json > "./sites/$PROJECT_PREFIX/ns-firewall.json"

      # Create nameservers
      hcloud server create --name "$PROJECT_PREFIX-ns1" --datacenter "$HETZNER_DATACENTER" --type "$HETZNER_TYPE" --image "$HETZNER_IMAGE" --user-data-from-file "./sites/$PROJECT_PREFIX/cloud-config.yaml" --firewall "$PROJECT_PREFIX-ts-firewall" --firewall "$PROJECT_PREFIX-ns-firewall" >/dev/null
      hcloud server describe "$PROJECT_PREFIX-ns1" -o json > "./sites/$PROJECT_PREFIX/ns1.json"
      hcloud server create --name "$PROJECT_PREFIX-ns2" --datacenter "$HETZNER_DATACENTER" --type "$HETZNER_TYPE" --image "$HETZNER_IMAGE" --user-data-from-file "./sites/$PROJECT_PREFIX/cloud-config.yaml" --firewall "$PROJECT_PREFIX-ts-firewall" --firewall "$PROJECT_PREFIX-ns-firewall" >/dev/null
      hcloud server describe "$PROJECT_PREFIX-ns2" -o json > "./sites/$PROJECT_PREFIX/ns2.json"


      NS1_PUBLIC_IP=$(hcloud server describe "$PROJECT_PREFIX-ns1" -o=format="{{.PublicNet.IPv4.IP}}")
      NS2_PUBLIC_IP=$(hcloud server describe "$PROJECT_PREFIX-ns2" -o=format="{{.PublicNet.IPv4.IP}}")

      cat << EOF >> ./.env
NS1_HOST=$PROJECT_PREFIX-ns1.$TAILSCALE_TAILNET
NS1_PUBLIC_IP=$NS1_PUBLIC_IP
NS2_HOST=$PROJECT_PREFIX-ns2.$TAILSCALE_TAILNET
NS2_PUBLIC_IP=$NS2_PUBLIC_IP

EOF
      echo "# Nameservers generated"
    fi

    EXIT_PUBLIC_IP=$(hcloud server describe "$PROJECT_PREFIX-exit" -o=format="{{.PublicNet.IPv4.IP}}")
    
    cat << EOF >> ./.env
EXIT_PUBLIC_IP=$EXIT_PUBLIC_IP

EOF
  fi #end if hetzner
fi #end if not local

. ./.env

. ./bin/genexit.sh
. ./bin/genns.sh

exit 1

# At this point all servers should be sites and we should have hostnames for the various systems
. ./.env

. ./bin/genapp.sh
 
# # Notify approver
# echo "If you don't have Tailscale autoApprovers setup, go to the admin console and enable the exit node for "$PROJECT_PREFIX-exit". Run the following command after."
# echo "ssh $TAILSCALE_OPERATOR@$APP_HOST \"sudo tailscale up --operator $TAILSCALE_OPERATOR --exit-node=$EXIT_TAILSCALE_IPV4 --ssh\""


