# docker build -t wcapp . -f ./app/Dockerfile && kc scale deployment wcapp --replicas=0 && kc scale deployment wcapp --replicas=1 --current-replicas=0
# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:18.16.0-alpine as builder
# RUN apk add postgresql-dev python3 make build-base

RUN apk update && apk add gettext

ARG CUST_LAND_HOSTNAME
ARG CUST_APP_HOSTNAME
ARG SITE_NAME
ARG KC_REALM
ARG KC_CLIENT
ARG KC_PATH
ARG TURN_NAME
ARG TURN_PASS

WORKDIR /app/website

COPY --from=awayto-deps /deps/node_modules /core/node_modules
COPY --from=awayto-deps /deps/node_modules /app/website/node_modules

COPY ./app/landing /land

WORKDIR /land
RUN --mount=type=cache,target=/root/.cache/yarn yarn install &&\
  envsubst < config.yaml.template > config.yaml &&\
  npm run build

RUN mkdir -p /core/src && mkdir -p /app/website/src && mkdir -p /app/website/public

WORKDIR /app/website

COPY /core/src/ /core/src
COPY /app/website/src/ /app/website/src
COPY /app/website/public/ /app/website/public
COPY /app/website/package.json /app/website/*config*.* /app/website/settings.application.env.template /app/website/

RUN envsubst < ./settings.application.env.template > ./settings.application.env

RUN npm run build

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