# docker build -t wcapi . && docker run --rm --init -e PG_HOST=192.168.1.53 -e PG_PORT=8082 -e PG_USER=postgres -e PG_PASSWORD=postgres -e PG_DATABASE=sysmaindb -p 8083:3000 wcapi

# as builder removed for dev
FROM node:16.3.0-alpine
EXPOSE 9443
RUN apk add postgresql-dev python3 make build-base
# added for dev
RUN mkdir -p /app/build

WORKDIR /app

CMD ["npm", "start"]

COPY ./api/package.json /app
RUN npm i --silent

COPY ./core /core
# COPY ./api /app

# RUN npm run build -- disabled for dev

# FROM node:16.3.0-alpine -- disabled for dev
# WORKDIR /app -- disabled for dev


# COPY ./api/server.cert /app -- disabled for dev
# COPY ./api/server.key /app -- disabled for dev
# COPY --from=builder /app/build/ /app -- disabled for dev