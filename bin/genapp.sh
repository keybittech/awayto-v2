#!/bin/sh
. ./.env

echo "Configuring db server..."
until ping -c1 $APP_HOST; do sleep 5; done
until ssh-keyscan -H $APP_HOST >> ~/.ssh/known_hosts; do sleep 5; done

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

# Build wcapp on the build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX

chmod +x ./build-deps && sudo ./build-deps

echo "# Building app image"
sudo docker compose build --build-arg ENVIRONMENT=deploy app

echo "# Tagging image"
sudo docker tag wcapp localhost:5000/wcapp:$BUILD_VERSION
sudo docker tag wcapp localhost:5000/wcapp:latest

echo "# Submitting image to registry"
sudo docker push localhost:5000/wcapp:$BUILD_VERSION
sudo docker push localhost:5000/wcapp:latest
EOF

ssh -T $TAILSCALE_OPERATOR@$APP_HOST << EOF

sudo tailscale up --operator $TAILSCALE_OPERATOR --exit-node=$PROJECT_PREFIX-exit --ssh

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing Docker"
  sudo mkdir -p /etc/docker
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
  echo '{ "insecure-registries": ["'"$BUILD_HOST"':5000"] }' | sudo tee /etc/docker/daemon.json > /dev/null
  sudo systemctl restart docker
fi

echo "# Pulling wcapp image"
# sudo docker pull $BUILD_HOST:5000/wcapp:$BUILD_VERSION

echo "# Starting app on $APP_HOST:443"
sudo docker run -d --restart always --name wcapp --network="host" \
  -e DOMAIN_NAME=$DOMAIN_NAME \
  -e SVC_HOST=$SVC_HOST \
  -e APP_HOST=$APP_HOST \
  -e DB_HOST=$DB_HOST \
  -e CUST_APP_HOSTNAME=$CUST_APP_HOSTNAME \
  -e CUST_LAND_HOSTNAME=$CUST_LAND_HOSTNAME \
  -e KC_REALM=$KC_REALM \
  -e KC_CLIENT=$KC_CLIENT \
  -e KC_PATH=/auth $BUILD_HOST:5000/wcapp:$BUILD_VERSION
EOF