#!/bin/sh
. ./.env

echo "Configuring db server..."
until ping -c1 $DB_HOST; do sleep 5; done
until ssh-keyscan -H $DB_HOST >> ~/.ssh/known_hosts; do sleep 5; done

# In order to deploy the DB, we need to setup the build server for it, build it, then pull it to the db server

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX

echo "# Creating volume for building"
sudo docker volume create pg15store
sudo docker volume create sqlitedata

echo "# Building db image"
sudo docker compose build --build-arg ENVIRONMENT=deploy db
sudo docker compose build fs

echo "# Tagging image"
sudo docker tag wcdb localhost:5000/wcdb:$BUILD_VERSION
sudo docker tag wcdb localhost:5000/wcdb:latest
sudo docker tag wcfs localhost:5000/wcfs:$BUILD_VERSION
sudo docker tag wcfs localhost:5000/wcfs:latest

echo "# Submitting image to registry"
sudo docker push localhost:5000/wcdb:$BUILD_VERSION
sudo docker push localhost:5000/wcdb:latest
sudo docker push localhost:5000/wcfs:$BUILD_VERSION
sudo docker push localhost:5000/wcfs:latest
EOF

ssh -T $TAILSCALE_OPERATOR@$DB_HOST << EOF

echo "# Install postgres client"
sudo apt-get install -y postgresql-client

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing Docker"
  sudo mkdir -p /etc/docker
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
  echo '{ "insecure-registries": ["'"$BUILD_HOST"':5000"] }' | sudo tee /etc/docker/daemon.json > /dev/null
  sudo systemctl restart docker
fi

echo "# Creating docker volumes"
sudo docker volume create pg15store
sudo docker volume create redisdata
sudo docker volume create sqlitedata

echo "# Pulling db image"
# sudo docker pull $BUILD_HOST:5000/wcdb:$BUILD_VERSION
# sudo docker pull $BUILD_HOST:5000/wcfs:$BUILD_VERSION

echo "# Allowing ports 5432 (postgres), 6379 (redis), 8000 (files) on $DB_HOST"
sudo ufw allow 5432
sudo ufw allow 6379
sudo ufw allow 8000

echo "# Starting postgres container"
sudo docker run -d --restart always --name wcdb --network="host" \
  -e POSTGRES_DB=$PG_DB \
  -e POSTGRES_USER=$PG_USER \
  -e POSTGRES_PASSWORD=$PG_PASS \
  -v pg15store:/var/lib/postgresql/data $BUILD_HOST:5000/wcdb:$BUILD_VERSION

echo "# Starting redis container"
sudo docker run -d --restart always --name wcredis --network="host" \
  -e REDIS_PASSWORD=$REDIS_PASS \
  -v redisdata:/bitnami/redis/data bitnami/redis:7.0

echo "# Starting files container"
sudo docker run -d --restart always --name wcfs --network="host" \
  -e SQLITE_DATA=/app/data/sqlite-db.db \
  -v sqlitedata:/app/data $BUILD_HOST:5000/wcfs:$BUILD_VERSION
EOF