#!/bin/sh
. ./.env

echo "Configuring build server..."
until ping -c1 $BUILD_HOST; do sleep 5; done
until ssh-keyscan -H $BUILD_HOST >> ~/.ssh/known_hosts; do sleep 5; done

# Install Docker, clone repo on build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
echo "# Installing docker"
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
echo "# Installing docker registry"
sudo docker run -d -p 5000:5000 --restart=always --name registry registry:2
echo "# Cloning repo"
git clone $PROJECT_REPO /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX
cd /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX
sudo cp ./deploy/docker-compose.yml ./docker-compose.yml
echo "# Build init complete"
EOF

# Put env file on build server
scp "./.env" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/.env"

# Get cert for build
echo "# Getting cert copy from exit"
ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem /home/$TAILSCALE_OPERATOR/
sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem /home/$TAILSCALE_OPERATOR/
sudo chown $TAILSCALE_OPERATOR:$TAILSCALE_OPERATOR /home/$TAILSCALE_OPERATOR/fullchain.pem
sudo chown $TAILSCALE_OPERATOR:$TAILSCALE_OPERATOR /home/$TAILSCALE_OPERATOR/privkey.pem
EOF

# Use scp to get cert
echo "# Moving cert copy to local env"
scp "$TAILSCALE_OPERATOR@$EXIT_HOST:/home/$TAILSCALE_OPERATOR/fullchain.pem" "./sites/$PROJECT_PREFIX/fullchain.pem"
scp "$TAILSCALE_OPERATOR@$EXIT_HOST:/home/$TAILSCALE_OPERATOR/privkey.pem" "./sites/$PROJECT_PREFIX/privkey.pem"

# Remove cert copies from exit host
echo "# Removing cert copy from exit"
ssh -T "$TAILSCALE_OPERATOR@$EXIT_HOST" << EOF
rm /home/$TAILSCALE_OPERATOR/fullchain.pem
rm /home/$TAILSCALE_OPERATOR/privkey.pem
EOF

# Put cert files on the build server
scp "./sites/$PROJECT_PREFIX/fullchain.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.crt"
scp "./sites/$PROJECT_PREFIX/privkey.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.key"


# Create cert keystore for auth
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
openssl pkcs12 -export -in /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.crt -inkey /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.key -out /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/keystore.p12 -name ${PROJECT_PREFIX}cert -passout pass:$KC_PASS
sudo apt-get install -y openjdk-11-jdk >/dev/null
keytool -importkeystore -srcstoretype PKCS12 -srckeystore /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/keystore.p12 -destkeystore /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/KeyStore.jks -deststoretype JKS -srcalias ${PROJECT_PREFIX}cert -deststorepass $KC_PASS -destkeypass $KC_PASS -srcstorepass $KC_PASS
EOF

