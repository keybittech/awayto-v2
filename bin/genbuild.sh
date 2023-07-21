#!/bin/sh
. ./.env

SERVER_DIR_LOC="/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/"
CA_CERT_LOC="/home/$TAILSCALE_OPERATOR/easy-rsa/pki/ca.crt"
CA_KEY_LOC="/home/$TAILSCALE_OPERATOR/easy-rsa/pki/private/ca.key"
EXIT_CERT_LOC="${SERVER_DIR_LOC}server.crt"
EXIT_KEY_LOC="${SERVER_DIR_LOC}server.key"

echo "Configuring build server..."
until ping -c1 $BUILD_HOST; do sleep 5; done
until ssh-keyscan -H $BUILD_HOST >> ~/.ssh/known_hosts; do sleep 5; done

echo "# Setup EasyRSA Internal Certificate Authority on the build server..."
# Move build files/env to build server
scp "./bin/installeasyrsa.sh" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/installeasyrsa.sh"
scp "./.env" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/.env"

# Move exit server cert to build server
echo "# Sending LE cert copy from exit"
ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
sudo tailscale file cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem $PROJECT_PREFIX-build:
EOF

# Install Docker, clone repo on build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF

echo "# Installing auth build dependencies"
sudo apt-get update >/dev/null
sudo apt-get install -y expect easy-rsa maven openjdk-11-jdk >/dev/null

if ! command -v docker >/dev/null 2>&1; then
  echo "# Installing docker"
  curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
fi

echo "# Installing docker registry"
sudo docker run -d -p 5000:5000 --restart=always --name registry registry:2

echo "# Cloning repo"
git clone $PROJECT_REPO /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX
cp /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/deploy/docker-compose.yml /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/docker-compose.yml

echo "# Increment version"
sh /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/bin/getversion.sh -i
echo "# Build init complete"

mv /home/$TAILSCALE_OPERATOR/.env /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/.env

echo "# Getting exit server cert on build"
sudo tailscale file get $SERVER_DIR_LOC
mv ${SERVER_DIR_LOC}fullchain.pem $EXIT_CERT_LOC
mv ${SERVER_DIR_LOC}privkey.pem $EXIT_KEY_LOC

echo "# Setting up EasyRSA"
mkdir /home/$TAILSCALE_OPERATOR/easy-rsa
ln -s /usr/share/easy-rsa/* ~/easy-rsa
chmod 700 /home/$TAILSCALE_OPERATOR/easy-rsa

export EASYRSA_REQ_ORG="$PROJECT_PREFIX"
export EASYRSA_REQ_EMAIL="$ADMIN_EMAIL"
export EASYRSA_REQ_OU="Internal"
export EASYRSA_REQ_CN="InternalCA"
export EASYRSA_ALGO="ec"
export EASYRSA_DIGEST="sha512"

mv /home/$TAILSCALE_OPERATOR/installeasyrsa.sh /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh
chmod +x /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh
cd /home/$TAILSCALE_OPERATOR/easy-rsa
/home/$TAILSCALE_OPERATOR/easy-rsa/easyrsa init-pki
CA_PASSWORD=$CA_PASS EASYRSA_BATCH=1 /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh

echo "# Generate P12 for exit and CA certs"
openssl pkcs12 -export -in $EXIT_CERT_LOC -inkey $EXIT_KEY_LOC -out ${SERVER_DIR_LOC}exit.p12 -name $PROJECT_PREFIX-exit-cert -passout pass:$KC_PASS >/dev/null
openssl pkcs12 -export -in $CA_CERT_LOC -inkey $CA_KEY_LOC -out ${SERVER_DIR_LOC}ca.p12 -name $PROJECT_PREFIX-ca-cert -passin pass:$CA_PASS -passout pass:$KC_PASS >/dev/null

echo "# Add certs p12 to JKS"
keytool -importkeystore -srcstoretype PKCS12 -srckeystore ${SERVER_DIR_LOC}exit.p12 -destkeystore ${SERVER_DIR_LOC}KeyStore.jks -deststoretype JKS -srcalias $PROJECT_PREFIX-exit-cert -deststorepass $KC_PASS -destkeypass $KC_PASS -srcstorepass $KC_PASS >/dev/null
keytool -importkeystore -srcstoretype PKCS12 -srckeystore ${SERVER_DIR_LOC}ca.p12 -destkeystore ${SERVER_DIR_LOC}KeyStore.jks -deststoretype JKS -srcalias $PROJECT_PREFIX-ca-cert -deststorepass $KC_PASS -destkeypass $KC_PASS -srcstorepass $KC_PASS >/dev/null

rm ${SERVER_DIR_LOC}exit.p12
rm ${SERVER_DIR_LOC}ca.p12

echo "# Cert generation complete!"
EOF


# ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
# sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem /home/$TAILSCALE_OPERATOR/
# sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem /home/$TAILSCALE_OPERATOR/
# sudo chown $TAILSCALE_OPERATOR:$TAILSCALE_OPERATOR /home/$TAILSCALE_OPERATOR/fullchain.pem
# sudo chown $TAILSCALE_OPERATOR:$TAILSCALE_OPERATOR /home/$TAILSCALE_OPERATOR/privkey.pem
# EOF

# # Use scp to get cert
# echo "# Moving cert copy to local env"
# scp "$TAILSCALE_OPERATOR@$EXIT_HOST:/home/$TAILSCALE_OPERATOR/fullchain.pem" "./sites/$PROJECT_PREFIX/fullchain.pem"
# scp "$TAILSCALE_OPERATOR@$EXIT_HOST:/home/$TAILSCALE_OPERATOR/privkey.pem" "./sites/$PROJECT_PREFIX/privkey.pem"

# # Remove cert copies from exit host
# echo "# Removing cert copy from exit"
# ssh -T "$TAILSCALE_OPERATOR@$EXIT_HOST" << EOF
# rm /home/$TAILSCALE_OPERATOR/fullchain.pem
# rm /home/$TAILSCALE_OPERATOR/privkey.pem
# EOF

# # Put cert files on the build server
# scp "./sites/$PROJECT_PREFIX/fullchain.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:${SERVER_DIR_LOC}server.crt"
# scp "./sites/$PROJECT_PREFIX/privkey.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:${SERVER_DIR_LOC}server.key"


