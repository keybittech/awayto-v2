#!/bin/sh

until ssh-keyscan -H $APP_HOST >> ~/.ssh/known_hosts; do
  echo "Waiting for SSH service on $PROJECT_PREFIX-app to become available..."
  sleep 5
done

# Configure host tailscale
ssh $TAILSCALE_OPERATOR@$APP_HOST "sudo tailscale up --operator $TAILSCALE_OPERATOR --exit-node=$EXIT_HOST --ssh"

# Install nginx on the host node
ssh $TAILSCALE_OPERATOR@$APP_HOST "sudo apt update && sudo apt install nginx -y"

# Allow HTTP/HTTPS through the firewall
ssh $TAILSCALE_OPERATOR@$APP_HOST "sudo ufw allow 'Nginx Full'"

# Test host nginx
ssh $TAILSCALE_OPERATOR@$APP_HOST "echo '<!DOCTYPE html><html><body><h1>Hello, World!</h1></body></html>' | sudo tee /var/www/html/index.html"

# Restart nginx on the app node
ssh $TAILSCALE_OPERATOR@$APP_HOST "sudo systemctl restart nginx"