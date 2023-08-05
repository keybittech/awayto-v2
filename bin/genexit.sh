#!/bin/sh

echo "Configuring exit server..."
until ping -c1 $EXIT_HOST; do sleep 5; done
until ssh-keyscan -H $EXIT_HOST >> ~/.ssh/known_hosts; do sleep 5; done

scp "./bin/installmodsec.sh" "$TAILSCALE_OPERATOR@$EXIT_HOST:/home/$TAILSCALE_OPERATOR/installmodsec.sh"

# Generate exit nginx config
echo "# Generate exit nginx config"
sed "s/domain-name/$DOMAIN_NAME/g; \
  s/host-ts-ip/$APP_HOST/g;" ./deploy/exit.nginx.conf | ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST "sudo tee /home/$TAILSCALE_OPERATOR/exit.nginx.conf > /dev/null"

ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
echo "# Configure exit node ip forwarding for tailscale"
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.all.forwarding = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p /etc/sysctl.conf

echo "# Advertising exit node"
sudo tailscale up --operator $TAILSCALE_OPERATOR --ssh --advertise-exit-node

echo "# Installing exit node dependencies"
sudo apt-get update > /dev/null
sudo apt-get install nginx certbot python3-certbot-nginx apache2-utils -y > /dev/null

echo "# Configure fail2ban for nginx"
sudo sed -i '/^[^#]*\[nginx-http-auth\]/a enabled = true' /etc/fail2ban/jail.local

echo "# Configure fail2ban for keycloak"
sudo bash -c 'echo -e "[Definition]\nfailregex = ^<HOST> -.*POST.*\/auth\/realms\/.*\/protocol\/openid-connect\/token HTTP\/.* 401\nignoreregex =" > /etc/fail2ban/filter.d/keycloak.conf'
sudo bash -c 'echo -e "[keycloak]\nenabled = true\nfilter = keycloak\naction = iptables-multiport[name=Keycloak, port=\"http,https\", protocol=tcp]\nlogpath = /var/log/nginx/access.log\nmaxretry = 5\nbantime = 600\nfindtime = 600\n" >> /etc/fail2ban/jail.local'

echo "# Configure fail2ban for repeated errors"
sudo bash -c 'echo -e "[Definition]\nfailregex = ^<HOST> -.*\"(POST|GET|HEAD).*\" (404|400) .*\nignoreregex = /auth/resources/.*|keycloak-bg.png|theme.png" > /etc/fail2ban/filter.d/nginx-http-errors.conf'
sudo bash -c 'echo -e "[nginx-http-errors]\nenabled = true\nfilter = nginx-http-errors\naction = iptables-multiport[name=NginxHTTPErrors, port=\"http,https\", protocol=tcp]\nlogpath = /var/log/nginx/access.log\nmaxretry = 5\nbantime = 600\nfindtime = 600\n" >> /etc/fail2ban/jail.local'

sudo systemctl restart fail2ban

echo "# Configure exit nginx"
sudo mv /home/$TAILSCALE_OPERATOR/exit.nginx.conf /etc/nginx/sites-available/exit.nginx.conf

# Hides version numbers
sudo sed -i '/http {/a server_tokens off;' /etc/nginx/nginx.conf

chmod +x /home/$TAILSCALE_OPERATOR/installmodsec.sh && /home/$TAILSCALE_OPERATOR/installmodsec.sh

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