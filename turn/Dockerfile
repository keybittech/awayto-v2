FROM coturn/coturn

COPY ./turnserver.conf /etc/coturn/turnserver.conf
# COPY ./turnserver.conf.template /etc/coturn/turnserver.conf.template


COPY ./server.crt /app
COPY ./server.key /app

# RUN sudo envsubst < /etc/coturn/turnserver.conf.template > /etc/coturn/turnserver.conf