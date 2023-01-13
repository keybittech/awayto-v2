# docker build -t wcapi . && docker run --rm --init -e PG_HOST=192.168.1.53 -e PG_PORT=8082 -e PG_USER=postgres -e PG_PASSWORD=postgres -e PG_DATABASE=sysmaindb -p 8083:3000 wcapi

FROM node:18-alpine
EXPOSE 3000
WORKDIR /app
CMD ["node", "api.js"]

COPY . /app