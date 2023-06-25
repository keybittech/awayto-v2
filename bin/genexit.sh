#!/bin/sh

until ssh-keyscan -H $EXIT_TAILSCALE_IPV4 >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-exit to become available..."
  sleep 5
done

# Configure exit node ip forwarding for tailscale
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf && echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf && sudo sysctl -p /etc/sysctl.conf && sudo tailscale up --operator $TAILSCALE_OPERATOR --ssh --advertise-exit-node"

# Exit node dependencies
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y"

# Check for the existence of /etc/nginx/sites-available/ directory
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"'

# Wait until /etc/nginx/sites-available/ directory is available
while [ "$(ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 '[ -d /etc/nginx/sites-available/ ] && echo "Directory exists" || echo "Directory does not exist"')" != "Directory exists" ]
do
  echo "Waiting for Nginx to finish setting up..."

  sleep 5
done

# Generate exit nginx config
echo "# Generate exit nginx config"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/host-ts-ip/$APP_TAILSCALE_IPV4/g;" ./deploy/exit.nginx.conf | ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo tee /etc/nginx/sites-available/exit.nginx.conf > /dev/null"

# Allow HTTP/HTTPS through the firewall
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo ufw allow 'Nginx Full'"

# Enable the exit nginx proxy
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo rm /etc/nginx/sites-enabled/default && sudo ln -s /etc/nginx/sites-available/exit.nginx.conf /etc/nginx/sites-enabled/ && sudo nginx -t"

# Restart exit nginx
ssh $TAILSCALE_OPERATOR@$EXIT_TAILSCALE_IPV4 "sudo systemctl restart nginx"