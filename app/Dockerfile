# docker build -t wcapp . && docker run --rm --init -p 443:443 wcapp
FROM node:16.3.0-alpine as builder
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app

RUN npm install --silent

COPY . /app

RUN npm run build-web


FROM nginx:alpine
EXPOSE 443
RUN mkdir -p /etc/ssl/private && chmod 700 /etc/ssl/private
CMD ["nginx", "-g", "daemon off;"]

COPY ./dhparam.pem /etc/ssl/certs/
COPY ./server.cert /etc/ssl/certs/
COPY ./server.key /etc/ssl/private/

COPY ./ssl.conf /etc/nginx/conf.d/
COPY ./ssl-redirect.conf /etc/nginx/default.d/

COPY --from=builder /app/build/ /usr/share/nginx/html/