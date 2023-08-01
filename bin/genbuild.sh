#!/bin/sh
. ./.env

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

mkdir -p $CERTS_DIR
sudo tailscale file get $CERTS_DIR
mv $CERTS_DIR/fullchain.pem $EXIT_FULLCHAIN_LOC
mv $CERTS_DIR/cert.pem $EXIT_CERT_LOC
mv $CERTS_DIR/privkey.pem $EXIT_KEY_LOC

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

mv $PROJECT_DIR/bin/installeasyrsa.sh $PROJECT_DIR/bin/installcsr.sh $PROJECT_DIR/bin/installcert.sh /home/$TAILSCALE_OPERATOR/easy-rsa/
chmod +x /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh /home/$TAILSCALE_OPERATOR/easy-rsa/installcsr.sh /home/$TAILSCALE_OPERATOR/easy-rsa/installcert.sh

cd /home/$TAILSCALE_OPERATOR/easy-rsa
./easyrsa init-pki >/dev/null 2>&1
CA_PASSWORD=$CA_PASS EASYRSA_BATCH=1 /home/$TAILSCALE_OPERATOR/easy-rsa/installeasyrsa.sh >/dev/null 2>&1
cp $EASYRSA_LOC/ca.crt $CA_CERT_LOC
cp $EASYRSA_LOC/private/ca.key $CA_KEY_LOC

echo "# Generating db-host cert"
SERVER_NAME=db_host TAILSCALE_OPERATOR=$TAILSCALE_OPERATOR CA_PASS=$CA_PASS /home/$TAILSCALE_OPERATOR/easy-rsa/installcert.sh
echo "# copying db host certs"
cp $EASYRSA_LOC/issued/db_host.crt $DB_CERT_LOC
cp $EASYRSA_LOC/private/db_host.key $DB_KEY_LOC

echo "# Generate a server auth cert for keycloak"
sed "s/domain-name/$DOMAIN_NAME/g; s/app-host/$APP_HOST/g;" $PROJECT_DIR/deploy/kcsa.cnf.template | tee $CERTS_DIR/kcsa.cnf
openssl req -new -newkey rsa:2048 -nodes -keyout $CERTS_DIR/keycloak.key -out $CERTS_DIR/keycloak.csr -subj "/CN=$APP_HOST" -config $CERTS_DIR/kcsa.cnf
./easyrsa import-req $CERTS_DIR/keycloak.csr keycloak
CSR_NAME=keycloak TAILSCALE_OPERATOR=$TAILSCALE_OPERATOR CA_PASS=$CA_PASS /home/$TAILSCALE_OPERATOR/easy-rsa/installcsr.sh

echo "Creating keycloak fullchain"
awk '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/' $EASYRSA_LOC/issued/keycloak.crt > $KC_FULLCHAIN_LOC
cat $CA_CERT_LOC >> $KC_FULLCHAIN_LOC

keytool -import -trustcacerts -noprompt -alias letsencrypt -file $EXIT_FULLCHAIN_LOC -keystore $KEYSTORE_LOC -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS
keytool -import -trustcacerts -noprompt -alias easyrsa -file $CA_CERT_LOC -keystore $KEYSTORE_LOC -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS

# openssl req -x509 -newkey rsa:4096 -out $CERTS_DIR/keycloak_server_authority.crt -keyout $CERTS_DIR/keycloak_server_authority.key -days 365 -subj "/CN=$APP_HOST" -extensions v3_req -passout pass:$CA_PASS -config $CERTS_DIR/kcsa.cnf >/dev/null 2>&1

# echo "# Generate P12 for db, exit and CA certs"
# openssl pkcs12 -export -in $CERTS_DIR/keycloak_server_authority.crt -inkey $CERTS_DIR/keycloak_server_authority.key -out $CERTS_DIR/keycloak.p12 -name $PROJECT_PREFIX-keycloak-cert -passin pass:$CA_PASS -passout pass:$CA_PASS >/dev/null 2>&1
# openssl pkcs12 -export -in $EXIT_FULLCHAIN_LOC -inkey $EXIT_KEY_LOC -out $CERTS_DIR/exit.p12 -name $PROJECT_PREFIX-exit-cert -passout pass:$CA_PASS  >/dev/null 2>&1
# openssl pkcs12 -export -in $CA_CERT_LOC -inkey $CA_KEY_LOC -out $CERTS_DIR/ca.p12 -name $PROJECT_PREFIX-ca-cert -passin pass:$CA_PASS -passout pass:$CA_PASS  >/dev/null 2>&1
# openssl pkcs12 -export -in "$EASYRSA_LOC/issued/$DB_HOST.crt" -inkey "$EASYRSA_LOC/private/$DB_HOST.key" -out "$CERTS_DIR/$DB_HOST.p12" -name $PROJECT_PREFIX-db-cert -passout pass:$CA_PASS >/dev/null 2>&1

# echo "# Add certs p12 to JKS"
# keytool -importkeystore -srcstoretype PKCS12 -srckeystore $CERTS_DIR/keycloak.p12 -destkeystore $KEYSTORE_LOC -deststoretype JKS -srcalias $PROJECT_PREFIX-keycloak-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS  >/dev/null 2>&1
# keytool -importkeystore -srcstoretype PKCS12 -srckeystore $CERTS_DIR/exit.p12 -destkeystore $KEYSTORE_LOC -deststoretype JKS -srcalias $PROJECT_PREFIX-exit-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS  >/dev/null 2>&1
# keytool -importkeystore -srcstoretype PKCS12 -srckeystore $CERTS_DIR/ca.p12 -destkeystore $KEYSTORE_LOC -deststoretype JKS -srcalias $PROJECT_PREFIX-ca-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS  >/dev/null 2>&1
# keytool -importkeystore -srcstoretype PKCS12 -srckeystore $CERTS_DIR/$DB_HOST.p12 -destkeystore $KEYSTORE_LOC -deststoretype JKS -srcalias $PROJECT_PREFIX-db-cert -deststorepass $CA_PASS -destkeypass $CA_PASS -srcstorepass $CA_PASS >/dev/null 2>&1

# rm $CERTS_DIR/exit.p12
# rm $CERTS_DIR/ca.p12

echo $CA_PASS > $PASS_LOC

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
# scp "./sites/$PROJECT_PREFIX/fullchain.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:$CERTS_DIR/server.crt"
# scp "./sites/$PROJECT_PREFIX/privkey.pem" "$TAILSCALE_OPERATOR@$BUILD_HOST:$CERTS_DIR/server.key"


