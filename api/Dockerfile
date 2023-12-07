# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:16.18.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base

RUN npm i -g pnpm

RUN mkdir -p /core/src && mkdir -p /api/src

# Compile core dependencies
WORKDIR /core

COPY /core/package.json /core/pnpm-*.yaml /core/
COPY /core/src/ /core/src

RUN pnpm install

# Compile api package
WORKDIR /api

COPY /api/src/ /api/src
COPY /api/package.json /api/pnpm-*.yaml /api/*config*.json /api/api.webpack.js /api/

RUN pnpm install && NODE_ENV=docker pnpm run build

FROM node:16.18.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /api

COPY ./certs/exit_fullchain.pem /api/exit_fullchain.pem
COPY ./certs/ca.crt /api/ca.crt
COPY ./certs/db_fullchain.pem /api/db_fullchain.pem
COPY ./certs/db_host.key /api/db_host.key

COPY --from=builder /api/build/ /api
