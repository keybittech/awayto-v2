# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:16.18.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
RUN mkdir -p /core/src && mkdir -p /api/src

WORKDIR /api

COPY --from=awayto-deps /deps/node_modules /core/node_modules
COPY --from=awayto-deps /deps/node_modules /api/node_modules

COPY /core/src/ /core/src
COPY /core/*config*.json /core/

COPY /api/src/ /api/src
COPY /api/package.json /api/*config*.json /api/api.webpack.js /api/

RUN NODE_ENV=docker npm run build

FROM node:16.18.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /api

COPY ./certs/ca.crt /api/ca.crt
COPY ./certs/db_host.crt /api/db_host.crt
COPY ./certs/db_host.key /api/db_host.key

COPY ./certs/ca.crt /usr/local/share/ca-certificates/ca.crt
RUN update-ca-certificates

COPY --from=builder /api/build/ /api