# docker build -t wcauth . && docker run --rm --init -p 8443:8443 wcauth

FROM quay.io/keycloak/keycloak:21.1 as builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
#RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore

COPY ./auth/custom-event-listener/target/*.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build --features=declarative-user-profile

FROM quay.io/keycloak/keycloak:21.1
COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY ./app/server/KeyStore.jks /opt/keycloak/conf
COPY ./auth/themes/base /opt/keycloak/themes/site

ENTRYPOINT [ "/opt/keycloak/bin/kc.sh", "start", "--optimized" ]
