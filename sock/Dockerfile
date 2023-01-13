# docker build -t wcsock . && docker run --rm --init -p 8081:8080 wcsock

FROM node:18-alpine
EXPOSE 8080
WORKDIR /app
CMD ["node", "sock.js"]

COPY . /app