# docker build -t wcapi . -f ./api/Dockerfile && kc scale deployment api --replicas=0 && kc scale deployment api --replicas=1 --current-replicas=0

FROM node:16.3.0-alpine as builder
RUN apk add postgresql-dev python3 make build-base
# added for dev
RUN mkdir -p /app/build

WORKDIR /app

COPY ./api/package*.json /app/
RUN npm i --silent --no-audit

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