#!/bin/sh
. ./.env

echo "Configuring auth server..."
until ping -c1 $APP_HOST; do sleep 5; done
until ssh-keyscan -H $APP_HOST >> ~/.ssh/known_hosts; do sleep 5; done

# Once the DB and redis are deployed, we can create the auth server

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF

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

ssh -T $TAILSCALE_OPERATOR@$APP_HOST << EOF

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

echo "# Starting Keycloak container"
sudo docker run -d --restart=always --name=wcauth --network="host" \
  -e KC_API_CLIENT_ID=$KC_API_CLIENT_ID \
  -e APP_HOST=$APP_HOST/api \
  -e KC_HTTPS_KEY_STORE_FILE=/opt/keycloak/conf/KeyStore.jks \
  -e KC_HTTPS_KEY_STORE_PASSWORD=${CA_PASS} \
  -e KC_SPI_TRUSTSTORE_FILE_FILE=/opt/keycloak/conf/KeyStore.jks \
  -e KC_SPI_TRUSTSTORE_FILE_PASSWORD=$KC_PASS \
  -e KC_SPI_TRUSTSTORE_FILE_HOSTNAME_VERIFICATION_POLICY=WILDCARD \
  -e KC_HOSTNAME_STRICT=false \
  -e KC_HOSTNAME_ADMIN_URL=https://$CUST_APP_HOSTNAME/auth \
  -e KC_HOSTNAME_URL=https://$CUST_APP_HOSTNAME/auth \
  -e KC_PROXY=edge \
  -e KC_HOSTNAME_STRICT_BACKCHANNEL=true \
  -e KEYCLOAK_ADMIN=$KC_ADMIN \
  -e KEYCLOAK_ADMIN_PASSWORD=$KC_PASS \
  -e KC_DB_URL=jdbc:postgresql://$DB_HOST:5432/$PG_DB \
  -e KC_DB_USERNAME=$PG_USER \
  -e KC_DB_PASSWORD=$PG_PASS \
  -e KC_REDIS_HOST=$DB_HOST \
  -e KC_REDIS_PORT=6379 \
  -e KC_REDIS_PASS=$REDIS_PASS \
  -e KC_REGISTRATION_RATE_LIMIT=10 $BUILD_HOST:5000/wcauth:$BUILD_VERSION

EOF
#  -e KC_HOSTNAME_STRICT_BACKCHANNEL=true \