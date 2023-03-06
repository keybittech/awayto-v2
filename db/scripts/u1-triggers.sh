#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

	\c sysmaindb

	CREATE TRIGGER set_group_code AFTER INSERT ON dbtable_schema.groups FOR EACH ROW EXECUTE FUNCTION make_group_code();

EOSQL
