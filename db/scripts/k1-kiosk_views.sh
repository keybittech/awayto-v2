#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb

  CREATE MATERIALIZED VIEW dbview_schema.kiosk_schedule AS
  SELECT g.*, NOW() as the_time
  FROM dbtable_schema.groups g;
  
EOSQL
