#!/bin/sh
. ./.env

echo "Configuring svc server..."
until ping -c1 $SVC_HOST; do sleep 5; done
until ssh-keyscan -H $SVC_HOST >> ~/.ssh/known_hosts; do sleep 5; done

BUILD_VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -g")

ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX

echo "# Creating volume for building"
sudo docker volume create graylogdata

echo "# Building logging, sock, turn image"
sudo docker compose build sock
sudo docker compose build turn

echo "# Tagging image"
sudo docker tag wcsock localhost:5000/wcsock:$BUILD_VERSION
sudo docker tag wcsock localhost:5000/wcsock:latest
sudo docker tag wcturn localhost:5000/wcturn:$BUILD_VERSION
sudo docker tag wcturn localhost:5000/wcturn:latest

echo "# Submitting image to registry"
sudo docker push localhost:5000/wcsock:$BUILD_VERSION
sudo docker push localhost:5000/wcsock:latest
sudo docker push localhost:5000/wcturn:$BUILD_VERSION
sudo docker push localhost:5000/wcturn:latest
EOF

scp "./turn/turnserver.conf.template" "$TAILSCALE_OPERATOR@$SVC_HOST:/home/$TAILSCALE_OPERATOR/turnserver.conf.template"

ssh -T $TAILSCALE_OPERATOR@$SVC_HOST << EOF

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing Docker"
  sudo mkdir -p /etc/docker
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
  echo '{ "insecure-registries": ["'"$BUILD_HOST"':5000"] }' | sudo tee /etc/docker/daemon.json > /dev/null
  sudo systemctl restart docker
fi

echo "# Allowing ports 8888 (sock), 9000 (graylog), 1514 (syslog), 12201 (gelf) on $SVC_HOST"
sudo ufw allow 8888
sudo ufw allow 9000
sudo ufw allow 1514
sudo ufw allow 1514/udp
sudo ufw allow 12201
sudo ufw allow 12201/udp

sudo docker stop wcsock
sudo docker stop wcturn
sudo docker stop mongo
sudo docker stop elasticsearch
sudo docker stop graylog
sudo docker system prune -a -f

echo "# Creating docker volumes/network"
sudo docker volume create graylogdata
sudo docker network create graylognet

echo "# Starting sock container"
sudo docker run -d --restart always --name wcsock --memory=100m --network="host" \
  --add-host=$DB_HOST:$(tailscale ip -4 $DB_HOST) \
  --add-host=$CUST_APP_HOSTNAME:$(tailscale ip -4 $APP_HOST) \
  -e API_HOST=${CUST_APP_HOSTNAME}/api \
  -e SOCK_SECRET=${SOCK_SECRET} \
  -e REDIS_HOST=${DB_HOST} \
  -e REDIS_PASS=${REDIS_PASS} \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
  -e CUST_APP_HOSTNAME=${CUST_APP_HOSTNAME} \
  -e KC_REALM=${KC_REALM} $BUILD_HOST:5000/wcsock:$BUILD_VERSION

CUST_APP_HOSTNAME=$CUST_APP_HOSTNAME envsubst < /home/$TAILSCALE_OPERATOR/turnserver.conf.template > /home/$TAILSCALE_OPERATOR/turnserver.conf

echo "# Starting turn container"
sudo docker run -d --restart always --name wcturn --memory=50m --network="host" \
  -v /home/$TAILSCALE_OPERATOR/turnserver.conf:/etc/coturn/turnserver.conf:ro \
  $BUILD_HOST:5000/wcturn:$BUILD_VERSION

echo "# Starting graylog containers"
sudo docker run -d --memory=200m --name=mongo --network="graylognet" mongo:5.0.13

sudo docker run -d --network="graylognet" --name=elasticsearch -e http.host=0.0.0.0 \
  --ulimit memlock=-1:-1 \
  --memory=1g \
  -e transport.host=localhost \
  -e network.host=0.0.0.0 \
  -e "ES_JAVA_OPTS=-Dlog4j2.formatMsgNoLookups=true -Xms512m -Xmx512m" \
  docker.elastic.co/elasticsearch/elasticsearch-oss:7.10.2

sudo docker run -d --restart always --network="graylognet" --name graylog \
  -p 9000:9000 \
  -p 1514:1514 \
  -p 1514:1514/udp \
  -p 12201:12201 \
  -p 12201:12201/udp \
  -e GRAYLOG_PASSWORD_SECRET=$GRAYLOG_PASSWORD_SECRET \
  -e GRAYLOG_ROOT_PASSWORD_SHA2=$GRAYLOG_ROOT_PASSWORD_SHA2 \
  -e GRAYLOG_HTTP_EXTERNAL_URI=http://$SVC_HOST:9000/ \
  -v graylogdata:/usr/share/graylog/data graylog/graylog:5.0
EOF