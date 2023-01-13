# docker build -t wcdb . && docker run --rm --init -p 8082:5432 -e POSTGRES_PASSWORD=postgres -v pgdata:/var/lib/postgresql/data wcdb

FROM postgres:13.0-alpine
EXPOSE 5432
USER postgres
RUN chmod 0700 /var/lib/postgresql/data &&\
    initdb /var/lib/postgresql/data &&\
    echo "host all  all    0.0.0.0/0  md5" >> /var/lib/postgresql/data/pg_hba.conf &&\
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf &&\
    pg_ctl start &&\
    psql -c "ALTER USER postgres WITH ENCRYPTED PASSWORD 'postgres';"

COPY ./init.sql /docker-entrypoint-initdb.d/