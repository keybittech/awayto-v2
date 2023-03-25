# docker build -t wcapp . -f ./app/Dockerfile && kc scale deployment wcapp --replicas=0 && kc scale deployment wcapp --replicas=1 --current-replicas=0
# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.3.0-alpine as builder
# RUN apk add postgresql-dev python3 make build-base

RUN apk update && apk add gettext

ARG CUST_LAND_HOSTNAME
ARG CUST_APP_HOSTNAME
ARG CUST_HOST_IP
ARG SITE_NAME

WORKDIR /land
COPY ./app/landing/package.json /land/
COPY ./app/landing/yarn.lock /land/
RUN --mount=type=cache,target=/land/node_modules yarn install

WORKDIR /app
COPY ./app/website/package.json /app/
COPY ./app/website/yarn.lock /app/
RUN --mount=type=cache,target=/app/node_modules yarn install

WORKDIR /land
COPY ./app/landing /land
RUN --mount=type=cache,target=/land/node_modules envsubst < /land/config.yaml.template > /land/config.yaml &&\
    npm run build

WORKDIR /app
COPY ./app/website /app
RUN --mount=type=cache,target=/app/node_modules envsubst < /app/settings.application.env.template > /app/settings.application.env &&\
    npm run build

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
COPY --from=builder /app/build/ /usr/share/nginx/html/app/