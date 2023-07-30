# docker build -t wcsock . && docker run --rm --init -p 8888:8888 wcsock

FROM node:16.18.0-alpine
EXPOSE 8888
WORKDIR /app
CMD ["node", "sock.js"]

COPY package.json /app/
COPY yarn.lock /app/

RUN yarn install

COPY . /app