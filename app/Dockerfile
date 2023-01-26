# docker build -t wcapp . -f ./app/Dockerfile && kc scale deployment wcapp --replicas=0 && kc scale deployment wcapp --replicas=1 --current-replicas=0
# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.3.0-alpine as builder
# RUN apk add postgresql-dev python3 make build-base

WORKDIR /land
COPY ./app/landing/package*.json /land/
RUN npm i --silent --no-audit

WORKDIR /app
COPY ./app/website/package*.json /app/
RUN npm config set timeout 6000000 && npm i --silent --no-audit

RUN apk update && apk add gettext

WORKDIR /land
COPY ./app/landing /land
RUN envsubst < /land/config.toml.template > /land/config.toml &&\
    npm run build

WORKDIR /app
COPY ./app/website /app
RUN envsubst < /app/settings.application.env.template > /app/settings.application.env &&\
    npm run build

FROM nginx:alpine
EXPOSE 443
RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
RUN mkdir -p /usr/share/nginx/html/app
CMD [ "nginx", "-g", "daemon off;"]

COPY ./app/server/server.crt /etc/ssl/certs/
COPY ./app/server/server.key /etc/ssl/private/
COPY ./app/server/ssl-redirect.conf /etc/nginx/default.d/
# COPY ./app/server/default.conf /etc/nginx/conf.d/
COPY ./app/server/default.conf.template /etc/nginx/templates/

COPY --from=builder /land/build/ /usr/share/nginx/html/
COPY --from=builder /app/build/ /usr/share/nginx/html/app/