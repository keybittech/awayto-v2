# docker build -t wcapi . && docker run --rm --init -e PG_HOST=192.168.1.53 -e PG_PORT=8082 -e PG_USER=postgres -e PG_PASSWORD=postgres -e PG_DATABASE=sysmaindb -p 8083:3000 wcapi

FROM node:16.3.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
# added for dev
RUN mkdir -p /app/build

WORKDIR /app

COPY ./api/package*.json /app/
RUN npm i --silent --no-audit --prefer-offline


COPY ./core /core
COPY ./api /app

RUN npm run build

FROM node:16.3.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /app

COPY ./api/server.crt /app
COPY ./api/server.key /app

COPY --from=builder /app/build/ /app