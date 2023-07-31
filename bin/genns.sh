#!/bin/sh

if [ "$CONFIGURE_NAMESERVERS" = "y" ]; then

  echo "# Configuring name servers"
  until ping -c1 $NS1_HOST; do sleep 5; done
  until ssh-keyscan -H $NS1_HOST >> ~/.ssh/known_hosts; do sleep 5; done

  # Declare last octets
  set -- $(echo $NS1_PUBLIC_IP | tr "." " ")
  NS1_LAST_OCTET=$4

  set -- $(echo $NS2_PUBLIC_IP | tr "." " ")
  NS2_LAST_OCTET=$4

  set -- $(echo $EXIT_PUBLIC_IP | tr "." " ")
  EXIT_LAST_OCTET=$4

  # Allow ns1 dns port 53
  ssh -T $TAILSCALE_OPERATOR@$NS1_HOST "sudo ufw allow in on eth0 to any port 53 proto tcp && sudo ufw allow in on eth0 to any port 53 proto udp"

  # Install master bind9
  ssh -T $TAILSCALE_OPERATOR@$NS1_HOST "sudo apt-get update && sudo apt-get install -y bind9 >/dev/null"

  # Declare ns1 octets
  set -- $(echo $NS1_PUBLIC_IP | tr "." " ")

  # Generate ns1 named.conf
  echo "# Generate ns1 named.conf"
  sed "s/domain-name/$DOMAIN_NAME/g; \
    s/base-dir/var\/cache\/bind/g; \
    s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
    s/first-octet/$1/g; \
    s/ns-type/master/g; \
    s/xfer-opt/allow-transfer/g; \
    s/notify-opt/notify no;/g; \
    s/target-ip/$NS2_PUBLIC_IP/g;" ./deploy/named.conf.local.template | ssh $TAILSCALE_OPERATOR@$NS1_HOST "sudo tee /etc/bind/named.conf.local > /dev/null"

  # Generate ns1 forward zone file
  echo "# Generate ns1 forward zone file"
  sed "s/domain-name/$DOMAIN_NAME/g; \
    s/ns-name/ns1/g; \
    s/ns-serial/${TIMESTAMP}10/g; \
    s/first-origin/@  IN  NS  ns1.$DOMAIN_NAME./g; \
    s/second-origin/@  IN  NS  ns2.$DOMAIN_NAME./g; \
    s/ns1-zone/ns1  IN  A  $NS1_PUBLIC_IP/g; \
    s/ns2-zone/ns2  IN  A  $NS2_PUBLIC_IP/g; \
    s/www-zone/www  IN  A  $EXIT_PUBLIC_IP/g; \
    s/app-zone/app  IN  A  $EXIT_PUBLIC_IP/g; \
    s/origin-zone/@  IN  A  $EXIT_PUBLIC_IP/g; " ./deploy/bind.db.template | ssh $TAILSCALE_OPERATOR@$NS1_HOST "sudo tee /var/cache/bind/db.$DOMAIN_NAME > /dev/null"

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
    /origin-zone/d; " ./deploy/bind.db.template | ssh $TAILSCALE_OPERATOR@$NS1_HOST "sudo tee /var/cache/bind/db.$1 > /dev/null"

  # Restart ns1 bind9
  ssh -T $TAILSCALE_OPERATOR@$NS1_HOST "sudo systemctl restart bind9"

  # Configure Secondary NS
  until ssh-keyscan -H $NS2_HOST >> ~/.ssh/known_hosts; do
    echo "Waiting for SSH service on $PROJECT_PREFIX-ns2 to become available..."
    sleep 5
  done

  # Allow ns2 dns port 53
  ssh -T $TAILSCALE_OPERATOR@$NS2_HOST "sudo ufw allow in on eth0 to any port 53 proto tcp && sudo ufw allow in on eth0 to any port 53 proto udp"

  # Install ns2 bind9
  ssh -T $TAILSCALE_OPERATOR@$NS2_HOST "sudo apt-get update && sudo apt-get install -y bind9  >/dev/null"

  # Declare ns2 octets
  set -- $(echo $NS2_PUBLIC_IP | tr "." " ")

  # Generate ns2 named.conf
  echo "# Generate ns2 named.conf"
  sed "s/domain-name/$DOMAIN_NAME/g; \
    s/base-dir/var\/cache\/bind/g; \
    s/in-addr-arpa/$3.$2.$1.in-addr.arpa/g; \
    s/first-octet/$1/g; \
    s/ns-type/slave/g; \
    s/xfer-opt/masters/g; \
    /notify-opt/d; \
    s/target-ip/$NS1_PUBLIC_IP/g;" ./deploy/named.conf.local.template | ssh $TAILSCALE_OPERATOR@$NS2_HOST "sudo tee /etc/bind/named.conf.local > /dev/null"

  # Restart ns2 bind9
  ssh -T $TAILSCALE_OPERATOR@$NS2_HOST "sudo systemctl restart bind9"

  echo "Configure $DOMAIN_NAME to use the following nameservers:"
  echo "ns1.$DOMAIN_NAME: $NS1_PUBLIC_IP"
  echo "ns2.$DOMAIN_NAME: $NS2_PUBLIC_IP"
fi

until ping -c1 "$DOMAIN_NAME" >/dev/null 2>&1; do
  echo "Waiting for $DOMAIN_NAME to be pingable. Will try again in 30 seconds."
  echo "Configure $DOMAIN_NAME to use the following nameservers:"
  echo "ns1.$DOMAIN_NAME: $NS1_PUBLIC_IP"
  echo "ns2.$DOMAIN_NAME: $NS2_PUBLIC_IP"
  sleep 30
done

ssh $TAILSCALE_OPERATOR@$EXIT_HOST "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -m $ADMIN_EMAIL --agree-tos --no-eff-email --redirect"