# docker build -t wcapp . -f ./app/Dockerfile && kc scale deployment wcapp --replicas=0 && kc scale deployment wcapp --replicas=1 --current-replicas=0
# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.18.0-alpine as builder
# RUN apk add postgresql-dev python3 make build-base

RUN apk update && apk add gettext

ARG WIZAPP_VERSION
ARG CUST_LAND_HOSTNAME
ARG CUST_APP_HOSTNAME
ARG CUST_HOST_IP
ARG SITE_NAME

COPY ./app/landing /land

WORKDIR /land
RUN --mount=type=cache,target=/root/.cache/yarn yarn install &&\
    envsubst < config.yaml.template > config.yaml &&\
    npm run build

RUN mkdir -p /core/src && mkdir -p /app/website/src && mkdir -p /app/website/public

COPY /core/src/ /core/src
COPY /core/package.json /core/yarn.lock /core/*config*.json /core/

WORKDIR /core
RUN --mount=type=cache,target=/root/.cache/yarn sed -i "s/file:..\/..\/wiz/${WIZAPP_VERSION}/g" ./package.json &&\
  yarn install

WORKDIR /app/website
COPY /app/website/package.json /app/website/yarn.lock /app/website/*config*.* /app/website/settings.application.env.template /app/website/
RUN --mount=type=cache,target=/root/.cache/yarn envsubst < ./settings.application.env.template > ./settings.application.env &&\
  sed -i "s/file:..\/..\/..\/wiz/${WIZAPP_VERSION}/g" ./package.json &&\
  yarn install

COPY /app/website/public/ /app/website/public
COPY /app/website/src/ /app/website/src

RUN npm run build

FROM nginx:alpine
EXPOSE 443
RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
RUN mkdir -p /usr/share/nginx/html/app
RUN ln -sf /dev/stdout /var/log/nginx/access.log &&\
    ln -sf /dev/stderr /var/log/nginx/error.log

CMD ["nginx-debug", "-g", "daemon off;"]
# CMD [ "nginx", "-g", "daemon off;"]
COPY ./app/server/server.crt /etc/ssl/certs/
COPY ./app/server/server.key /etc/ssl/private/
COPY ./app/server/ssl-redirect.conf /etc/nginx/default.d/
COPY ./app/server/nginx.conf /etc/nginx/nginx.conf
COPY ./app/server/.htpasswd /conf/htpasswd

# with ngrok
# COPY ./app/server/ngrok/default.conf.template /etc/nginx/templates/default.conf

# local
COPY ./app/server/local/default.conf.template /etc/nginx/templates/

COPY --from=builder /land/build/ /usr/share/nginx/html/
COPY --from=builder /app/website/build/ /usr/share/nginx/html/app/