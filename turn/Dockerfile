FROM coturn/coturn

WORKDIR /app

# Create a directory for logs
RUN mkdir /app/logs

# Change ownership of the logs directory
RUN chown nobody:nogroup /app/logs

# Set environment variable for Coturn to use the custom log directory
ENV TURN_LOG_FILE="/app/logs/turnserver.log"

# COPY ./certs/db_fullchain.pem /app/server.crt
# COPY ./certs/db_host.key /app/server.key