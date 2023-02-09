#!/usr/bin/env bash
# --bind=$(grep CUST_HOST_IP .env | cut -d '=' -f2) 

# with ngrok
# sudo hugo serve --liveReloadPort 443 --port=443 --appendPort=false --baseURL=https://$(grep CUST_LAND_HOSTNAME .env | cut -d '=' -f2) -s . -d ./public

# with local
hugo serve --appendPort=false --bind=$(grep CUST_HOST_IP .env | cut -d '=' -f2) --baseURL=https://$(grep CUST_LAND_HOSTNAME .env | cut -d '=' -f2) -s . -d ./public
