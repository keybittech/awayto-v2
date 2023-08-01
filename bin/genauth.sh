#!/bin/sh
. ./.env

echo "Configuring auth server..."
until ping -c1 $APP_HOST; do sleep 5; done
until ssh-keyscan -H $APP_HOST >> ~/.ssh/known_hosts; do sleep 5; done

# Once the DB and redis are deployed, we can create the auth server

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF

cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX
git pull

echo "# Building auth event listener"
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/auth/custom-event-listener
mvn install

cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX

echo "# Building auth image"
sudo docker compose build auth

echo "# Tagging image"
sudo docker tag wcauth localhost:5000/wcauth:$BUILD_VERSION
sudo docker tag wcauth localhost:5000/wcauth:latest

echo "# Submitting image to registry"
sudo docker push localhost:5000/wcauth:$BUILD_VERSION
sudo docker push localhost:5000/wcauth:latest
EOF

scp "./bin/installauth.sh" "$TAILSCALE_OPERATOR@$APP_HOST:/home/$TAILSCALE_OPERATOR/installauth.sh"

ssh -T $TAILSCALE_OPERATOR@$APP_HOST << EOF

sudo apt-get update
sudo apt-get install jq -y

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing Docker"
  sudo mkdir -p /etc/docker
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
  echo '{ "insecure-registries": ["'"$BUILD_HOST"':5000"] }' | sudo tee /etc/docker/daemon.json > /dev/null
  sudo systemctl restart docker
fi

echo "# Allowing app port 8080/8443 (keycloak) on $APP_HOST"
sudo ufw allow 8080
sudo ufw allow 8443

sudo docker stop wcauth
sudo docker system prune -a -f

echo "# Starting Keycloak container"
sudo docker run -d --restart=always --name=wcauth --network="host" \
  --add-host=$CUST_APP_HOSTNAME:$(tailscale ip -4 $APP_HOST) \
  -e KC_API_CLIENT_ID=$KC_API_CLIENT_ID \
  -e KC_PROXY=edge \
  -e KC_HTTPS_CERTIFICATE_FILE=/opt/keycloak/conf/keycloak_fullchain.pem \
  -e KC_HTTPS_CERTIFICATE_KEY_FILE=/opt/keycloak/conf/keycloak.key \
  -e KC_SPI_TRUSTSTORE_FILE_FILE=/opt/keycloak/conf/KeyStore.jks \
  -e KC_SPI_TRUSTSTORE_FILE_PASSWORD=$CA_PASS \
  -e KC_SPI_TRUSTSTORE_FILE_HOSTNAME_VERIFICATION_POLICY=ANY \
  -e API_HOST=$DB_HOST:9443/api \
  -e KC_HOSTNAME_ADMIN_URL=https://$CUST_APP_HOSTNAME/auth \
  -e KC_HOSTNAME_URL=https://$CUST_APP_HOSTNAME/auth \
  -e KEYCLOAK_ADMIN=$KC_ADMIN \
  -e KEYCLOAK_ADMIN_PASSWORD=$KC_PASS \
  -e KC_DB_URL=jdbc:postgresql://$DB_HOST:5432/$PG_DB \
  -e KC_DB_USERNAME=$PG_USER \
  -e KC_DB_PASSWORD=$PG_PASS \
  -e KC_REDIS_HOST=$DB_HOST \
  -e KC_REDIS_PORT=6379 \
  -e KC_REDIS_PASS=$REDIS_PASS \
  -e KC_REGISTRATION_RATE_LIMIT=10 $BUILD_HOST:5000/wcauth:$BUILD_VERSION

chmod +x /home/$TAILSCALE_OPERATOR/installauth.sh
sudo KC_ADMIN=$KC_ADMIN KC_PASS=$KC_PASS KC_CLIENT=$KC_CLIENT KC_REALM=$KC_REALM PROJECT_PREFIX=$PROJECT_PREFIX CUST_APP_HOSTNAME=$CUST_APP_HOSTNAME KC_API_CLIENT_ID=$KC_API_CLIENT_ID KC_API_CLIENT_SECRET=$KC_API_CLIENT_SECRET /home/$TAILSCALE_OPERATOR/installauth.sh

EOF