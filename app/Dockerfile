# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.3.0-alpine as builder
WORKDIR /app
COPY ./app/website/package.json /app

RUN npm i --silent

COPY core /app/src/core
COPY ./app/website /app

RUN npm run build-web


FROM nginx:alpine
EXPOSE 443
RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
CMD ["nginx", "-g", "daemon off;"]

COPY ./app/server/dhparam.pem /etc/ssl/certs/
COPY ./app/server/server.cert /etc/ssl/certs/
COPY ./app/server/server.key /etc/ssl/private/

COPY ./app/server/ssl-redirect.conf /etc/nginx/default.d/
COPY ./app/server/ssl.conf /etc/nginx/conf.d/

COPY --from=builder /app/build/ /usr/share/nginx/html/