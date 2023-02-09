#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

\c sysmaindb

CREATE UNIQUE INDEX unique_owner ON groups (created_sub) WHERE (created_sub IS NOT NULL);
CREATE UNIQUE INDEX unique_code ON groups (lower(code));

EOSQL
