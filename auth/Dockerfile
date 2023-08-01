# docker build -t wcauth . && docker run --rm --init -p 8443:8443 wcauth

FROM quay.io/keycloak/keycloak:21.1 as builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

ENV KC_DB=postgres

WORKDIR /opt/keycloak

COPY ./auth/custom-event-listener/target/*.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build --features=declarative-user-profile

FROM quay.io/keycloak/keycloak:21.1

USER root

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY ./certs/KeyStore.jks /opt/keycloak/conf/KeyStore.jks
COPY ./certs/keycloak_fullchain.pem /opt/keycloak/conf/keycloak_fullchain.pem
COPY ./certs/keycloak.key /opt/keycloak/conf/keycloak.key
COPY ./auth/themes/base /opt/keycloak/themes/site

RUN chown keycloak: /opt/keycloak/conf/KeyStore.jks \
    && chown keycloak: /opt/keycloak/conf/keycloak_fullchain.pem \
    && chown keycloak: /opt/keycloak/conf/keycloak.key \
    && chmod 600 /opt/keycloak/conf/KeyStore.jks \
    && chmod 600 /opt/keycloak/conf/keycloak_fullchain.pem \
    && chmod 600 /opt/keycloak/conf/keycloak.key

USER keycloak

ENTRYPOINT [ "/opt/keycloak/bin/kc.sh", "start", "--optimized" ]
