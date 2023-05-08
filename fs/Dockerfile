FROM alpine:3.15.0

RUN apk add sqlite socat

COPY ./sh/*.sh /app/

WORKDIR /app

RUN chmod +x *.sh

CMD ["sh", "entrypoint.sh"]
