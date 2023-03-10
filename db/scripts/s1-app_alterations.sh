#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb

  CREATE UNIQUE INDEX unique_enabled_name_created_sub ON dbtable_schema.schedules (name, created_sub) WHERE (enabled = true);

  CREATE UNIQUE INDEX unique_uuid_role_external_id ON dbtable_schema.uuid_roles (external_id) WHERE (external_id IS NOT NULL);
  CREATE UNIQUE INDEX unique_group_owner ON dbtable_schema.groups (created_sub) WHERE (created_sub IS NOT NULL);
  CREATE UNIQUE INDEX unique_code ON dbtable_schema.groups (lower(code));

  ALTER DATABASE sysmaindb SET intervalstyle = 'iso_8601';
  
EOSQL
