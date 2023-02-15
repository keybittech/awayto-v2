#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  \c sysmaindb

  CREATE UNIQUE INDEX unique_uuid_role_external_id ON uuid_roles (external_id) WHERE (external_id IS NOT NULL);
  CREATE UNIQUE INDEX unique_group_owner ON groups (created_sub) WHERE (created_sub IS NOT NULL);
  CREATE UNIQUE INDEX unique_code ON groups (lower(code));

EOSQL