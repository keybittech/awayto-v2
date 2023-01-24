# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.3.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
WORKDIR /app
COPY ./app/website/package*.json /app/

RUN npm i --silent --no-audit --prefer-offline

COPY ./core /app/src/core
COPY ./app/website /app

RUN npm run build



FROM nginx:alpine
EXPOSE 443
RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
RUN mkdir -p /usr/share/nginx/html/app
CMD [ "nginx", "-g", "daemon off;"]

COPY ./app/server/server.crt /etc/ssl/certs/
COPY ./app/server/server.key /etc/ssl/private/

COPY ./app/server/ssl-redirect.conf /etc/nginx/default.d/
COPY ./app/server/default.conf /etc/nginx/conf.d/

COPY --from=builder /app/landing_build/ /usr/share/nginx/html/
COPY --from=builder /app/web_build/ /usr/share/nginx/html/app/