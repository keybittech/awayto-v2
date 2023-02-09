# docker build -t wcsock . && docker run --rm --init -p 8081:8080 wcsock

FROM node:16.3.0-alpine
EXPOSE 8080
WORKDIR /app
CMD ["node", "sock.js"]

COPY package.json /app/
COPY yarn.lock /app/

RUN yarn install

COPY . /app