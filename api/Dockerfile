# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:20.0.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
RUN mkdir -p /core/src && mkdir -p /api/src

ARG WIZAPP_VERSION

COPY /core/src/ /core/src
COPY /core/package.json /core/yarn.lock /core/*config*.json /core/

WORKDIR /core

RUN sed -i "s/file:..\/..\/wiz/${WIZAPP_VERSION}/g" ./package.json
RUN --mount=type=cache,target=/root/.cache/yarn yarn install

COPY /api/src/ /api/src
COPY /api/package.json /api/yarn.lock /api/*config*.json /api/api.webpack.js /api/

WORKDIR /api

RUN sed -i "s/file:..\/..\/wiz/${WIZAPP_VERSION}/g" ./package.json
RUN --mount=type=cache,target=/root/.cache/yarn yarn install
RUN NODE_ENV=docker npm run build

FROM node:20.0.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /api

COPY /api/server.crt /api/server.key /api

COPY --from=builder /api/build/ /api