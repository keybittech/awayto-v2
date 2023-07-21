#!/bin/sh

echo "Configuring exit server..."
until ping -c1 $EXIT_HOST; do sleep 5; done
until ssh-keyscan -H $EXIT_HOST >> ~/.ssh/known_hosts; do sleep 5; done

ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
echo "# Configure exit node ip forwarding for tailscale"
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p /etc/sysctl.conf

echo "# Advertising exit node"
sudo tailscale up --operator $TAILSCALE_OPERATOR --ssh --advertise-exit-node

echo "# Installing exit node dependencies"
sudo apt-get update > /dev/null
sudo apt-get install nginx certbot python3-certbot-nginx -y > /dev/null

echo "# Generate exit nginx config"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/host-ts-ip/$APP_HOST/g;" ./deploy/exit.nginx.conf | ssh $TAILSCALE_OPERATOR@$EXIT_HOST "sudo tee /etc/nginx/sites-available/exit.nginx.conf > /dev/null"

echo "# Configure exit nginx"
sudo ufw allow "Nginx Full"
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/exit.nginx.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
EOF

# Check for the existence of /etc/nginx/sites-available/ directory
# ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"'

# # Wait until /etc/nginx/sites-available/ directory is available
# while [ "$(ssh $TAILSCALE_OPERATOR@$EXIT_HOST '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"')" != "Directory exists" ]
# do
#   echo "Waiting for Nginx to finish setting up..."
#   sleep 5
# done

# Generate exit nginx config

# Allow HTTP/HTTPS through the firewall