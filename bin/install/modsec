#!/bin/sh

sudo apt install g++ flex bison curl apache2-dev doxygen libyajl-dev ssdeep liblua5.2-dev libgeoip-dev libtool dh-autoreconf libcurl4-gnutls-dev libxml2 libpcre++-dev libxml2-dev git liblmdb-dev libpkgconf3 lmdb-doc pkgconf zlib1g-dev libssl-dev -y

cd /opt

sudo wget https://github.com/SpiderLabs/ModSecurity/releases/download/v3.0.8/modsecurity-v3.0.8.tar.gz

sudo tar xzf modsecurity-v3.0.8.tar.gz

cd modsecurity-v3.0.8

sudo ./build.sh

sudo ./configure

sudo make

sudo make install

cd /opt && sudo git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

NGINX_VERSION=$(nginx -v 2>&1)
NGINX_VERSION=${NGINX_VERSION#*/}
NGINX_VERSION=${NGINX_VERSION% (*}

echo "# Found nginx version $NGINX_VERSION"

sudo wget http://nginx.org/download/nginx-$NGINX_VERSION.tar.gz
sudo tar -xvzmf nginx-$NGINX_VERSION.tar.gz
cd nginx-$NGINX_VERSION

NGINX_ARGS=$(nginx -V 2>&1 | awk -F: '/configure arguments:/ {print $2}' | sed 's/--add-dynamic-module=[^ ]* //')

echo "# Using nginx args $NGINX_ARGS"

eval "sudo ./configure $NGINX_ARGS --add-dynamic-module=../ModSecurity-nginx"

sudo make modules

sudo mkdir /etc/nginx/modules

sudo cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules

sudo bash -c 'echo "load_module /etc/nginx/modules/ngx_http_modsecurity_module.so;" | cat - /etc/nginx/nginx.conf > temp && mv temp /etc/nginx/nginx.conf'

sudo rm -rf /usr/share/modsecurity-crs

sudo git clone https://github.com/coreruleset/coreruleset /usr/local/modsecurity-crs

sudo mv /usr/local/modsecurity-crs/crs-setup.conf.example /usr/local/modsecurity-crs/crs-setup.conf

sudo mv /usr/local/modsecurity-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf.example /usr/local/modsecurity-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf

sudo mkdir -p /etc/nginx/modsec

sudo cp /opt/modsecurity-v3.0.8/unicode.mapping /etc/nginx/modsec
sudo cp /opt/modsecurity-v3.0.8/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf

sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/g' /etc/nginx/modsec/modsecurity.conf

sudo touch /etc/nginx/modsec/main.conf

echo 'SecAction "id:900200, phase:1, pass, t:none, nolog, setvar:\'tx.allowed_methods=GET HEAD POST OPTIONS PUT\'"'
echo "\n# Allow PUT Method\nSecAction \"id:900200, phase:1, pass, t:none, nolog, setvar:'tx.allowed_methods=GET HEAD POST OPTIONS PUT'\""

sudo bash -c 'echo "Include /etc/nginx/modsec/modsecurity.conf
Include /usr/local/modsecurity-crs/crs-setup.conf
Include /usr/local/modsecurity-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf'