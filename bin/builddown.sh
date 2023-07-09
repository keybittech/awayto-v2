#!/bin/sh
. ./.env

# Remove cert files from build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
rm "/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.crt"
rm "/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/server.key"
rm "/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/keystore.p12"
rm "/home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX/app/server/KeyStore.jks"
EOF

# Stop Docker registry and remove Docker on build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
sudo docker stop registry && sudo docker rm registry
sudo apt-get purge docker-ce
EOF

# Remove project repo on build server
ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST << EOF
rm -rf /home/$TAILSCALE_OPERATOR/$PROJECT_PREFIX
EOF

# Remove cert files from local directory
rm "./sites/$PROJECT_PREFIX/fullchain.pem"
rm "./sites/$PROJECT_PREFIX/privkey.pem"