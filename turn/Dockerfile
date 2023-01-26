FROM coturn/coturn

COPY ./turnserver.conf.template /etc/coturn/turnserver.conf.template


COPY ./server.crt /app
COPY ./server.key /app

RUN envsubst < /etc/coturn/turnserver.conf.template > /etc/coturn/turnserver.conf