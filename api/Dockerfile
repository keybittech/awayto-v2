# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:16.3.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base

# build core
WORKDIR /core
COPY ./core /core
COPY ./core/package.json /core/
COPY ./core/yarn.lock /core/

RUN sed -i 's/file:..\/..\/wiz/0.2.0-beta.1/g' package.json
RUN --mount=type=cache,target=/core/node_modules yarn install

# build api
RUN mkdir -p /api/build

WORKDIR /api
COPY ./api/package.json /api/
COPY ./api/yarn.lock /api/

RUN sed -i 's/file:..\/..\/wiz/0.2.0-beta.1/g' package.json
RUN --mount=type=cache,target=/api/node_modules yarn install

COPY ./api /api
RUN --mount=type=cache,target=/api/node_modules npm run build

FROM node:16.3.0-alpine
CMD ["node", "api.js"]
EXPOSE 9443
WORKDIR /api

COPY ./api/server.crt /api
COPY ./api/server.key /api

COPY --from=builder /api/build/ /api