# docker build -t wcapp . -f ./app/Dockerfile && kc scale deployment wcapp --replicas=0 && kc scale deployment wcapp --replicas=1 --current-replicas=0
# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:18.16.0-alpine as builder

RUN apk update && apk add gettext

RUN npm i -g pnpm

ARG CUST_LAND_HOSTNAME
ARG CUST_APP_HOSTNAME
ARG PROJECT_REPO
ARG SITE_NAME
ARG KC_REALM
ARG KC_CLIENT
ARG KC_PATH
ARG TURN_NAME
ARG TURN_PASS

RUN mkdir -p /core/src && mkdir -p /app/website/src && mkdir -p /app/website/public

# Compile landing page
WORKDIR /land

COPY /app/landing /land

RUN envsubst < config.yaml.template > config.yaml &&\
  pnpm install && pnpm run build

# Compile core dependencies
WORKDIR /core

COPY /core/package.json /core/pnpm-*.yaml /core/
COPY /core/src/ /core/src

RUN pnpm install

# Compile app website
WORKDIR /app/website

COPY /app/website/src/ /app/website/src
COPY /app/website/public/ /app/website/public
COPY /app/website/package.json /app/website/pnpm-*.yaml /app/website/*config*.* /app/website/settings.application.env.template /app/website/

RUN envsubst < ./settings.application.env.template > ./settings.application.env &&\
  pnpm install && pnpm run build

# Generate Nginx server
FROM nginx:alpine

ARG ENVIRONMENT=local

EXPOSE 443

RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
RUN mkdir -p /usr/share/nginx/html/app
RUN ln -sf /dev/stdout /var/log/nginx/access.log &&\
    ln -sf /dev/stderr /var/log/nginx/error.log

# CMD ["nginx-debug", "-g", "daemon off;"]
CMD [ "nginx", "-g", "daemon off;"]
COPY ./certs/exit_fullchain.pem /etc/ssl/certs/server.crt
COPY ./certs/exit_privkey.pem /etc/ssl/private/server.key
COPY ./certs/server.pass /etc/nginx/ssl_pass
COPY ./app/server/ssl-redirect.conf /etc/nginx/default.d/
COPY ./app/server/nginx.conf /etc/nginx/nginx.conf
# COPY ./app/server/.htpasswd /conf/htpasswd

COPY ./app/server/${ENVIRONMENT}/default.conf.template /etc/nginx/templates/

COPY --from=builder /land/build/ /usr/share/nginx/html/
COPY --from=builder /app/website/build/ /usr/share/nginx/html/app/
