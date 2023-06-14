#!/bin/sh

. ./.env

mkdir -p deployed

if [ -z "$CLOUD_PROVIDER" ]; then
  read -p "Cloud - \"aws\" or \"hetzner\" (hetzner): " CLOUD_PROVIDER
  CLOUD_PROVIDER=${CLOUD_PROVIDER:-hetzner}
fi

if [ -z "$PROJECT_PREFIX" ]; then
  read -p "Project prefix - used to identify resources (openssl rand -hex 16): " PROJECT_PREFIX
  PROJECT_PREFIX=${PROJECT_PREFIX:-$(openssl rand -hex 16)}
fi

# Continue with the rest of the script...
if [ "$CLOUD_PROVIDER" = "aws" ]; then
  # Check if aws is installed
  if ! command -v aws >/dev/null 2>&1; then
    echo "'aws' command line tool is required but not installed. Please install it and retry."
    exit 1
  fi

  aws ec2 run-instances --image-id $AWS_AMI_ID --count 1 --instance-type $AWS_INSTANCE_TYPE --key-name $AWS_KEY_NAME --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value='$SECRETS_SERVER_NAME'}]' 
elif [ "$CLOUD_PROVIDER" = "hetzner" ]; then
  # Check if hcloud is installed
  if ! command -v hcloud >/dev/null 2>&1; then
    echo "'hcloud' command line tool is required but not installed. Please install it and retry."
    exit 1
  fi

  # Validate required params
  echo "Datacenter ${HETZNER_DATACENTER:?'missing in .env'}"
  echo "Type ${HETZNER_TYPE:?'missing in .env'}"
  echo "Image ${HETZNER_IMAGE:?'missing in .env'}"

  # Create a new firewall
  hcloud firewall create --name $PROJECT_PREFIX-firewall --rules-file ./hetzner/firewall.json

  # Configure the cloud-config file for first-run deployment
  sed "s/dummyuser/$TS_OPERATOR/g; s/ts-auth-key/$TS_AUTH_KEY/g" ./hetzner/cloud-config.yaml.template > ./deployed/cloud-config.yaml

  # Create nameservers
  hcloud server create --name $PROJECT_PREFIX-ns1 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-firewall
  hcloud server create --name $PROJECT_PREFIX-ns2 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-firewall

  # Describe resources
  hcloud firewall describe $PROJECT_PREFIX-firewall -o json > ./deployed/firewall.json
  hcloud server describe $PROJECT_PREFIX-ns1 -o json > ./deployed/ns1.json
  hcloud server describe $PROJECT_PREFIX-ns2 -o json > ./deployed/ns2.json

fi



NS1_TS_IP=""
while [ -z "$NS1_TS_IP" ]; do
  NS1_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-ns1)
  if [ -z "$NS1_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-ns1 to become available..."
    sleep 5
  fi
done

NS2_TS_IP=""
while [ -z "$NS2_TS_IP" ]; do
  NS2_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-ns2)
  if [ -z "$NS2_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-ns2 to become available..."
    sleep 5
  fi
done

# Configure Master NS
until ssh-keyscan -H $NS1_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-ns1 to become available..."
  sleep 5
done
ssh $TS_OPERATOR@$NS1_TS_IP "sudo apt-get update && sudo apt-get install -y bind9"
set -- $(echo $NS1_TS_IP | tr "." " ")
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/base-dir/etc\/bind/g;
  s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
  s/first-octet/$1/g; \
  s/ns-type/master/g; \
  s/xfer-opt/allow-transfer/g; \
  s/notify-opt/notify no;/g; \
  s/target-ip/$NS2_TS_IP/g;" \
  ./named.conf.local.template | ssh $TS_OPERATOR@$NS1_TS_IP "sudo tee /etc/bind/named.conf.local > /dev/null"

# Configure Secondary NS
until ssh-keyscan -H $NS2_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-ns2 to become available..."
  sleep 5
done
ssh $TS_OPERATOR@$NS2_TS_IP "sudo apt-get update && sudo apt-get install -y bind9"
set -- $(echo $NS2_TS_IP | tr "." " ")
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/base-dir/var\/cache\/bind/g;
  s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
  s/first-octet/$1/g; \
  s/ns-type/slave/g; \
  s/xfer-opt/masters/g; \
  /notify-opt/d; \
  s/target-ip/$NS1_TS_IP/g;" \
  ./named.conf.local.template | ssh $TS_OPERATOR@$NS2_TS_IP "sudo tee /etc/bind/named.conf.local > /dev/null"