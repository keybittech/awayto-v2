# docker build -t wcauth . && docker run --rm --init -p 8443:8443 wcauth

FROM quay.io/keycloak/keycloak:21.1 as builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

ENV KC_DB=postgres

WORKDIR /opt/keycloak

COPY ./auth/custom-event-listener/target/*.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build --features=declarative-user-profile

FROM quay.io/keycloak/keycloak:21.1

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY ./certs/KeyStore.jks /opt/keycloak/conf/KeyStore.jks
COPY ./certs/keycloak.crt /opt/keycloak/conf/keycloak.crt
COPY ./certs/keycloak.key /opt/keycloak/conf/keycloak.key
COPY ./auth/themes/base /opt/keycloak/themes/site

USER root

RUN chmod 600 /opt/keycloak/conf/KeyStore.jks \
    && chmod 600 /opt/keycloak/conf/keycloak.crt \
    && chmod 600 /opt/keycloak/conf/keycloak.key

USER jboss

ENTRYPOINT [ "/opt/keycloak/bin/kc.sh", "start", "--optimized" ]
