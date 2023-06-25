#!/bin/sh

until ssh-keyscan -H $APP_TAILSCALE_IPV4 >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-app to become available..."
  sleep 5
done

# Configure host tailscale
ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 "sudo tailscale up --operator $TAILSCALE_OPERATOR --exit-node=$EXIT_TAILSCALE_IPV4 --ssh"

# Install nginx on the host node
ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 "sudo apt update && sudo apt install nginx -y"

# Allow HTTP/HTTPS through the firewall
ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 "sudo ufw allow 'Nginx Full'"

# Test host nginx
ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 "echo '<!DOCTYPE html><html><body><h1>Hello, World!</h1></body></html>' | sudo tee /var/www/html/index.html"

# Restart nginx on the app node
ssh $TAILSCALE_OPERATOR@$APP_TAILSCALE_IPV4 "sudo systemctl restart nginx"