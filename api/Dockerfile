# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:16.3.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
# added for dev
RUN mkdir -p /api/build

WORKDIR /api

COPY ./api/package.json /api/
COPY ./api/yarn.lock /api/
RUN --mount=type=cache,target=/api/node_modules yarn install

COPY ./api /api
COPY ./app/website/src/core /api/src/core

RUN --mount=type=cache,target=/api/node_modules npm run build

FROM node:16.3.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /api

COPY ./api/server.crt /api
COPY ./api/server.key /api

COPY --from=builder /api/build/ /api