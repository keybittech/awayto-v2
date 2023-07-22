FROM alpine:3.15.0

RUN apk add uuidgen sqlite socat

COPY ./fs/sh/*.sh /app/

WORKDIR /app

RUN chmod +x *.sh

CMD ["sh", "entrypoint.sh"]
