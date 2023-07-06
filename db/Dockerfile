# # docker build -t wcdb . && docker run --rm --init -p 8082:5432 -e POSTGRES_PASSWORD=postgres -v pgdata:/var/lib/postgresql/data wcdb

FROM postgres:15.0-alpine
EXPOSE 5432

COPY ./scripts /docker-entrypoint-initdb.d
RUN chmod -R 755 /docker-entrypoint-initdb.d/

CMD ["postgres"]