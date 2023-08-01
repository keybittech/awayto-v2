#!/bin/sh
. ./.env

EASYRSA_LOC="/home/$TAILSCALE_OPERATOR/easy-rsa/pki"
CA_CERT_LOC="$EASYRSA_LOC/ca.crt"
CA_KEY_LOC="$EASYRSA_LOC/private/ca.key"
PROJECT_DIR="/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX"
SERVER_DIR_LOC="$PROJECT_DIR/app/server"
PASS_LOC="$SERVER_DIR_LOC/server.pass"
EXIT_CERT_LOC="$SERVER_DIR_LOC/server.crt"
EXIT_FULLCHAIN_LOC="$SERVER_DIR_LOC/fullchain.pem"
EXIT_KEY_LOC="$SERVER_DIR_LOC/server.key"
API_CERT_LOC="$PROJECT_DIR/api/server.crt"
API_KEY_LOC="$PROJECT_DIR/api/server.key"
SOCK_CERT_LOC="$PROJECT_DIR/sock/server.crt"
SOCK_KEY_LOC="$PROJECT_DIR/sock/server.key"
TURN_CERT_LOC="$PROJECT_DIR/turn/server.crt"
TURN_KEY_LOC="$PROJECT_DIR/turn/server.key"

echo "Configuring build server..."
until ping -c1 $BUILD_HOST; do sleep 5; done
until ssh-keyscan -H $BUILD_HOST >> ~/.ssh/known_hosts; do sleep 5; done

echo "# Setup EasyRSA Internal Certificate Authority on the build server..."
# Move build files/env to build server
scp "./.env" "$TAILSCALE_OPERATOR@$BUILD_HOST:/home/$TAILSCALE_OPERATOR/.env"

# Move exit server cert to build server
echo "# Sending LE cert copy from exit"
ssh -T $TAILSCALE_OPERATOR@$EXIT_HOST << EOF
sudo tailscale file cp /etc/letsencrypt/live/$DOMAIN_NAME/cert.pem /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem $BUILD_HOST:
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
git clone $PROJECT_REPO $PROJECT_DIR
cp $PROJECT_DIR/deploy/docker-compose.yml $PROJECT_DIR/docker-compose.yml

echo "# Increment version"
sh $PROJECT_DIR/bin/getversion.sh -i
echo "# Build init complete"

mv /home/$TAILSCALE_OPERATOR/.env $PROJECT_DIR/.env

echo "# Getting exit server cert on build"
sudo tailscale file get $SERVER_DIR_LOC
mv $SERVER_DIR_LOC/cert.pem $EXIT_CERT_LOC
mv $SERVER_DIR_LOC/privkey.pem $EXIT_KEY_LOC

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

mv $PROJECT_DIR/bin/installeasyrsa.sh /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh
chmod +x /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh
cd /home/$TAILSCALE_OPERATOR/easy-rsa
./easyrsa init-pki >/dev/null 2>&1
CA_PASSWORD=$CA_PASS EASYRSA_BATCH=1 /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh >/dev/null 2>&1

echo "# Generate db server cert"
mv $PROJECT_DIR/bin/installcert.sh /home/$TAILSCALE_OPERATOR/easy-rsa/installcert.sh
chmod +x /home/$TAILSCALE_OPERATOR/easy-rsa/installcert.sh
PROJECT_PREFIX=$PROJECT_PREFIX ADMIN_EMAIL=$ADMIN_EMAIL TAILSCALE_OPERATOR=$TAILSCALE_OPERATOR CA_PASS=$CA_PASS SERVER_NAME=$DB_HOST EASYRSA_BATCH=1 /home/$TAILSCALE_OPERATOR/easy-rsa/installcert.sh

echo "# Generate P12 for db, exit and CA certs"
openssl pkcs12 -export -in $EXIT_FULLCHAIN_LOC -inkey $EXIT_KEY_LOC -out $SERVER_DIR_LOC/exit.p12 -name $PROJECT_PREFIX-exit-cert -passout pass:$CA_PASS  >/dev/null 2>&1
openssl pkcs12 -export -in $CA_CERT_LOC -inkey $CA_KEY_LOC -out $SERVER_DIR_LOC/ca.p12 -name $PROJECT_PREFIX-ca-cert -passin pass:$CA_PASS -passout pass:$CA_PASS  >/dev/null 2>&1
openssl pkcs12 -export -in "$EASYRSA_LOC/issued/$DB_HOST.crt" -inkey "$EASYRSA_LOC/private/$DB_HOST.key" -out "$SERVER_DIR_LOC/$DB_HOST.p12" -name $PROJECT_PREFIX-db-cert -passout pass:$CA_PASS >/dev/null 2>&1

echo "# Add certs p12 to JKS"
keytool -importkeystore -srcstoretype PKCS12 -srckeystore $SERVER_DIR_LOC/exit.p12 -destkeystore $SERVER_DIR_LOC/KeyStore.jks -deststoretype JKS -srcalias $PROJECT_PREFIX-exit-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS  >/dev/null 2>&1
keytool -importkeystore -srcstoretype PKCS12 -srckeystore $SERVER_DIR_LOC/ca.p12 -destkeystore $SERVER_DIR_LOC/KeyStore.jks -deststoretype JKS -srcalias $PROJECT_PREFIX-ca-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS  >/dev/null 2>&1
keytool -importkeystore -srcstoretype PKCS12 -srckeystore $SERVER_DIR_LOC/$DB_HOST.p12 -destkeystore $SERVER_DIR_LOC/KeyStore.jks -deststoretype JKS -srcalias $PROJECT_PREFIX-db-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS >/dev/null 2>&1

rm $SERVER_DIR_LOC/exit.p12
rm $SERVER_DIR_LOC/ca.p12

echo $CA_PASS > $PASS_LOC

echo "# Configuring certs"
cp $EASYRSA_LOC/private/$DB_HOST.key $API_KEY_LOC
cp $EASYRSA_LOC/issued/$DB_HOST.crt $API_CERT_LOC

cp $EXIT_KEY_LOC $SOCK_KEY_LOC
cp $EXIT_CERT_LOC $SOCK_CERT_LOC

cp $EXIT_KEY_LOC $TURN_KEY_LOC
cp $EXIT_CERT_LOC $TURN_CERT_LOC

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
# scp "./sites/$PROJECT_PREFIX/fullchain.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:$SERVER_DIR_LOC/server.crt"
# scp "./sites/$PROJECT_PREFIX/privkey.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:$SERVER_DIR_LOC/server.key"


