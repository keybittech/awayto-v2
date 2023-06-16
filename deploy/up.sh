#!/bin/sh

. ./.env

mkdir -p deployed

TIMESTAMP=$(date +%Y%m%d)

if [ -z "$CLOUD_PROVIDER" ]; then
  read -p "Cloud - \"aws\" or \"hetzner\" (hetzner): " CLOUD_PROVIDER
  CLOUD_PROVIDER=${CLOUD_PROVIDER:-hetzner}
fi

if [ -z "$PROJECT_PREFIX" ]; then
  read -p "Project prefix - used to identify resources (openssl rand -hex 16): " PROJECT_PREFIX
  PROJECT_PREFIX=${PROJECT_PREFIX:-$(openssl rand -hex 16)}
fi

NS1_REAL_IP=${NS1_REAL_IP:-""}
NS2_REAL_IP=${NS2_REAL_IP:-""}
EXIT_REAL_IP=${EXIT_REAL_IP:-""}
HOST_REAL_IP=${HOST_REAL_IP:-""}
NS1_TS_IP=${NS1_TS_IP:-""}
NS2_TS_IP=${NS2_TS_IP:-""}
EXIT_TS_IP=${EXIT_TS_IP:-""}
HOST_TS_IP=${HOST_TS_IP:-""}

if [ "$CLOUD_PROVIDER" = "aws" ]; then
  # Check if aws is installed
  if ! command -v aws >/dev/null 2>&1; then
    echo "'aws' command line tool is required but not installed. Please install it and retry."
    exit 1
  fi

  aws ec2 run-instances --image-id $AWS_AMI_ID --count 1 --instance-type $AWS_INSTANCE_TYPE --key-name $AWS_KEY_NAME --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value='$SECRETS_SERVER_NAME'}]' 
elif [ "$CLOUD_PROVIDER" = "hetzner" ]; then
  date >> ./deployed/hetzner

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
  hcloud firewall create --name $PROJECT_PREFIX-ts-firewall --rules-file ./hetzner/ts-firewall.json

  # Configure the cloud-config file for first-run deployment
  echo "# Configure the cloud-config file for first-run deployment"
  sed "s/dummyuser/$TS_OPERATOR/g; s/ts-auth-key/$TS_AUTH_KEY/g" ./cloud-config.yaml.template > ./deployed/cloud-config.yaml

  # Create ns firewall
  hcloud firewall create --name $PROJECT_PREFIX-ns-firewall --rules-file ./hetzner/ns-firewall.json

  # Create nameservers
  hcloud server create --name $PROJECT_PREFIX-ns1 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-ns-firewall >/dev/null
  hcloud server create --name $PROJECT_PREFIX-ns2 --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-ns-firewall >/dev/null

  # Create public firewall
  hcloud firewall create --name $PROJECT_PREFIX-public-firewall --rules-file ./hetzner/public-firewall.json

  # Create exit node
  hcloud server create --name $PROJECT_PREFIX-exit --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall --firewall $PROJECT_PREFIX-public-firewall >/dev/null

  # Create host node
  hcloud server create --name $PROJECT_PREFIX-host --datacenter $HETZNER_DATACENTER --type $HETZNER_TYPE --image $HETZNER_IMAGE --user-data-from-file ./deployed/cloud-config.yaml --firewall $PROJECT_PREFIX-ts-firewall >/dev/null

  # Describe resources
  hcloud firewall describe $PROJECT_PREFIX-ns-firewall -o json > ./deployed/ns-firewall.json
  hcloud firewall describe $PROJECT_PREFIX-ts-firewall -o json > ./deployed/ts-firewall.json
  hcloud firewall describe $PROJECT_PREFIX-public-firewall -o json > ./deployed/public-firewall.json

  hcloud server describe $PROJECT_PREFIX-ns1 -o json > ./deployed/ns1.json
  hcloud server describe $PROJECT_PREFIX-ns2 -o json > ./deployed/ns2.json
  hcloud server describe $PROJECT_PREFIX-exit -o json > ./deployed/exit.json
  hcloud server describe $PROJECT_PREFIX-host -o json > ./deployed/host.json

  NS1_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-ns1 -o=format="{{.PublicNet.IPv4.IP}}") 
  NS2_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-ns2 -o=format="{{.PublicNet.IPv4.IP}}") 
  EXIT_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-exit -o=format="{{.PublicNet.IPv4.IP}}") 
  HOST_REAL_IP=$(hcloud server describe $PROJECT_PREFIX-host -o=format="{{.PublicNet.IPv4.IP}}") 

fi

# Wait for tailscale attachments

while [ -z "$HOST_TS_IP" ]; do
  HOST_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-host)
  if [ -z "$HOST_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-host to become available..."
    sleep 5
  fi
done

while [ -z "$EXIT_TS_IP" ]; do
  EXIT_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-exit)
  if [ -z "$EXIT_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-exit to become available..."
    sleep 5
  fi
done

while [ -z "$NS1_TS_IP" ]; do
  NS1_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-ns1)
  if [ -z "$NS1_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-ns1 to become available..."
    sleep 5
  fi
done

while [ -z "$NS2_TS_IP" ]; do
  NS2_TS_IP=$(tailscale ip -4 $PROJECT_PREFIX-ns2)
  if [ -z "$NS2_TS_IP" ]; then
    echo "Waiting for $PROJECT_PREFIX-ns2 to become available..."
    sleep 5
  fi
done

until ssh-keyscan -H $EXIT_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-exit to become available..."
  sleep 5
done

# Configure exit node ip forwarding for tailscale
ssh $TS_OPERATOR@$EXIT_TS_IP "echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf && echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf && sudo sysctl -p /etc/sysctl.conf && sudo tailscale up --operator $TS_OPERATOR --ssh --advertise-exit-node"

# Exit node dependencies
ssh $TS_OPERATOR@$EXIT_TS_IP "sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y"

# Check for the existence of /etc/nginx/sites-available/ directory
ssh $TS_OPERATOR@$EXIT_TS_IP '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"'

# Wait until /etc/nginx/sites-available/ directory is available
while [ "$(ssh $TS_OPERATOR@$EXIT_TS_IP '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"')" != "Directory exists" ]
do
  echo "Waiting for Nginx to finish setting up..."

  sleep 5
done

# Generate exit nginx config
echo "# Generate exit nginx config"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/host-ts-ip/$HOST_TS_IP/g;" ./exit.nginx.conf | ssh $TS_OPERATOR@$EXIT_TS_IP "sudo tee /etc/nginx/sites-available/exit.nginx.conf > /dev/null"

# Allow HTTP/HTTPS through the firewall
ssh $TS_OPERATOR@$EXIT_TS_IP "sudo ufw allow 'Nginx Full'"

# Enable the exit nginx proxy
ssh $TS_OPERATOR@$EXIT_TS_IP "sudo rm /etc/nginx/sites-enabled/default && sudo ln -s /etc/nginx/sites-available/exit.nginx.conf /etc/nginx/sites-enabled/ && sudo nginx -t"

# Restart exit nginx
ssh $TS_OPERATOR@$EXIT_TS_IP "sudo systemctl restart nginx"

until ssh-keyscan -H $HOST_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-host to become available..."
  sleep 5
done

# Configure host tailscale
ssh $TS_OPERATOR@$HOST_TS_IP "sudo tailscale up --operator $TS_OPERATOR --exit-node=$EXIT_TS_IP --ssh"

# Install nginx on the host node
ssh $TS_OPERATOR@$HOST_TS_IP "sudo apt update && sudo apt install nginx -y"

# Allow HTTP/HTTPS through the firewall
ssh $TS_OPERATOR@$HOST_TS_IP "sudo ufw allow 'Nginx Full'"

# Test host nginx
ssh $TS_OPERATOR@$HOST_TS_IP "echo '<!DOCTYPE html><html><body><h1>Hello, World!</h1></body></html>' | sudo tee /var/www/html/index.html"

# Restart nginx on the host node
ssh $TS_OPERATOR@$HOST_TS_IP "sudo systemctl restart nginx"

# Configure Master NS
until ssh-keyscan -H $NS1_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-ns1 to become available..."
  sleep 5
done


# Declare last octets
set -- $(echo $NS1_REAL_IP | tr "." " ")
NS1_LAST_OCTET=$4

set -- $(echo $NS2_REAL_IP | tr "." " ")
NS2_LAST_OCTET=$4

set -- $(echo $EXIT_REAL_IP | tr "." " ")
EXIT_LAST_OCTET=$4

# Allow ns1 dns port 53
ssh $TS_OPERATOR@$NS1_TS_IP "sudo ufw allow in on eth0 to any port 53 proto tcp && sudo ufw allow in on eth0 to any port 53 proto udp"

# Install master bind9
ssh $TS_OPERATOR@$NS1_TS_IP "sudo apt-get update && sudo apt-get install -y bind9"

# Declare ns1 octets
set -- $(echo $NS1_REAL_IP | tr "." " ")

# Generate ns1 named.conf
echo "# Generate ns1 named.conf"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/base-dir/var\/cache\/bind/g; \
  s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
  s/first-octet/$1/g; \
  s/ns-type/master/g; \
  s/xfer-opt/allow-transfer/g; \
  s/notify-opt/notify no;/g; \
  s/target-ip/$NS2_REAL_IP/g;" ./named.conf.local.template | ssh $TS_OPERATOR@$NS1_TS_IP "sudo tee /etc/bind/named.conf.local > /dev/null"

# Generate ns1 forward zone file
echo "# Generate ns1 forward zone file"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/ns-name/ns1/g; \
  s/ns-serial/${TIMESTAMP}10/g; \
  s/first-origin/@  IN  NS  ns1.$DOMAIN_NAME./g; \
  s/second-origin/@  IN  NS  ns2.$DOMAIN_NAME./g; \
  s/ns1-zone/ns1  IN  A  $NS1_REAL_IP/g; \
  s/ns2-zone/ns2  IN  A  $NS2_REAL_IP/g; \
  s/www-zone/www  IN  A  $EXIT_REAL_IP/g; \
  s/app-zone/app  IN  A  $EXIT_REAL_IP/g; \
  s/origin-zone/@  IN  A  $EXIT_REAL_IP/g; " ./bind.db.template | ssh $TS_OPERATOR@$NS1_TS_IP "sudo tee /var/cache/bind/db.$DOMAIN_NAME > /dev/null"

# Generate ns1 reverse zone file
echo "# Generate ns1 reverse zone file"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/ns-name/ns1/g; \
  s/ns-serial/${TIMESTAMP}11/g; \
  s/first-origin/@  IN  NS  ns1.$DOMAIN_NAME./g; \
  s/second-origin/@  IN  NS  ns2.$DOMAIN_NAME./g; \
  s/ns1-zone/$NS1_LAST_OCTET  IN  PTR  ns1.$DOMAIN_NAME./g; \
  s/ns2-zone/$NS2_LAST_OCTET  IN  PTR  ns2.$DOMAIN_NAME./g; \
  s/www-zone/$EXIT_LAST_OCTET  IN  PTR  www.$DOMAIN_NAME./g; \
  /app-zone/d; \
  /origin-zone/d; " ./bind.db.template | ssh $TS_OPERATOR@$NS1_TS_IP "sudo tee /var/cache/bind/db.$1 > /dev/null"

# Restart ns1 bind9
ssh $TS_OPERATOR@$NS1_TS_IP "sudo systemctl restart bind9"

# Configure Secondary NS
until ssh-keyscan -H $NS2_TS_IP >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-ns2 to become available..."
  sleep 5
done

# Allow ns2 dns port 53
ssh $TS_OPERATOR@$NS2_TS_IP "sudo ufw allow in on eth0 to any port 53 proto tcp && sudo ufw allow in on eth0 to any port 53 proto udp"

# Install ns2 bind9
ssh $TS_OPERATOR@$NS2_TS_IP "sudo apt-get update && sudo apt-get install -y bind9"

# Declare ns2 octets
set -- $(echo $NS2_REAL_IP | tr "." " ")

# Generate ns2 named.conf
echo "# Generate ns2 named.conf"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/base-dir/var\/cache\/bind/g; \
  s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
  s/first-octet/$1/g; \
  s/ns-type/slave/g; \
  s/xfer-opt/masters/g; \
  /notify-opt/d; \
  s/target-ip/$NS1_REAL_IP/g;" ./named.conf.local.template | ssh $TS_OPERATOR@$NS2_TS_IP "sudo tee /etc/bind/named.conf.local > /dev/null"

# Restart ns2 bind9
ssh $TS_OPERATOR@$NS2_TS_IP "sudo systemctl restart bind9"

echo "------ POST INSTALLATION ------"

# Notify approver
echo "If you don't have Tailscale autoApprovers setup, go to the admin console and enable the exit node for $PROJECT_PREFIX-exit. Run the following command after."
echo "ssh $TS_OPERATOR@$HOST_TS_IP \"sudo tailscale up --operator $TS_OPERATOR --exit-node=$EXIT_TS_IP --ssh\""

echo "You can now configure your registrar to point $DOMAIN_NAME to:\nns1: $NS1_REAL_IP\nns2: $NS2_REAL_IP"
echo "When DNS propagation has resolved, enable certbot with the following:"
echo "ssh $TS_OPERATOR@$EXIT_TS_IP \"sudo certbot --nginx -d $DOMAIN_NAME -m <your email> --agree-tos --no-eff-email --redirect\""

