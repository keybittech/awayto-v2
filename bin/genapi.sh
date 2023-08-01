#!/bin/sh
. ./.env

echo "Configuring api..."
until ping -c1 $DB_HOST; do sleep 5; done
until ssh-keyscan -H $DB_HOST >> ~/.ssh/known_hosts; do sleep 5; done

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX

git pull

chmod +x ./build-deps && sudo ./build-deps

echo "# Building api image"
sudo docker compose build api

echo "# Tagging image"
sudo docker tag wcapi localhost:5000/wcapi:$BUILD_VERSION
sudo docker tag wcapi localhost:5000/wcapi:latest

echo "# Submitting image to registry"
sudo docker push localhost:5000/wcapi:$BUILD_VERSION
sudo docker push localhost:5000/wcapi:latest

echo "# Sending CA cert to db server"
sudo tailscale file cp $DB_FULLCHAIN_LOC $EXIT_FULLCHAIN_LOC $DB_HOST:
EOF

ssh -T $TAILSCALE_OPERATOR@$DB_HOST << EOF
echo "# Adding CA cert to db-host certs"
sudo tailscale file get /usr/local/share/ca-certificates/
sudo update-ca-certificates

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing Docker"
  sudo mkdir -p /etc/docker
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
  echo '{ "insecure-registries": ["'"$BUILD_HOST"':5000"] }' | sudo tee /etc/docker/daemon.json > /dev/null
  sudo systemctl restart docker
fi

echo "# Allowing ports 9443 (api) on $DB_HOST"
sudo ufw allow 9443

sudo docker stop wcapi
sudo docker rm wcapi

echo "# Starting api container"
sudo docker run -d --restart always --name wcapi --network="host" \
  --add-host=$DB_HOST:$(tailscale ip -4 $DB_HOST) \
  --add-host=$APP_HOST:$(tailscale ip -4 $APP_HOST) \
  --add-host=$SVC_HOST:$(tailscale ip -4 $SVC_HOST) \
  --add-host=$CUST_APP_HOSTNAME:$(tailscale ip -4 $APP_HOST) \
  -e NODE_EXTRA_CA_CERTS=/api/ca.crt \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e API_COOKIE=$API_COOKIE \
  -e KC_REALM=$KC_REALM \
  -e KC_CLIENT=$KC_CLIENT \
  -e KC_API_CLIENT_ID=$KC_API_CLIENT_ID \
  -e KC_API_CLIENT_SECRET=$KC_API_CLIENT_SECRET \
  -e DB_URL=jdbc:postgresql://$PG_USER:$PG_PASS@$DB_HOST:5432/$PG_DB \
  -e APP_HOST=$APP_HOST \
  -e CUST_APP_HOSTNAME=$CUST_APP_HOSTNAME \
  -e KC_HOST=$APP_HOST \
  -e KC_PORT=8443 \
  -e FS_HOST=$DB_HOST \
  -e FS_PORT=8000 \
  -e PG_HOST=$DB_HOST \
  -e PG_PORT=5432 \
  -e PG_USER=$PG_USER \
  -e PG_PASSWORD=$PG_PASS \
  -e PG_DATABASE=$PG_DB \
  -e GRAYLOG_HOST=$SVC_HOST \
  -e GRAYLOG_PORT=12201 \
  -e SOCK_HOST=$SVC_HOST \
  -e SOCK_PORT=8888 \
  -e SOCK_SECRET=$SOCK_SECRET \
  -e REDIS_HOST=$DB_HOST \
  -e REDIS_PORT=6379 \
  -e REDIS_PASS=$REDIS_PASS $BUILD_HOST:5000/wcapi:$BUILD_VERSION
EOF
# 