#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

	\c sysmaindb

	CREATE FUNCTION make_group_code() RETURNS TRIGGER 
	AS $$
		BEGIN
			LOOP
				BEGIN
					UPDATE dbtable_schema.groups SET "code" = LOWER(SUBSTRING(MD5(''||NOW()::TEXT||RANDOM()::TEXT) FOR 8))
					WHERE "id" = NEW.id;
					EXIT;
				EXCEPTION WHEN unique_violation THEN

				END;
			END LOOP;
			RETURN NEW;
		END;
	$$ LANGUAGE PLPGSQL VOLATILE;

	CREATE TRIGGER set_group_code AFTER INSERT ON dbtable_schema.groups FOR EACH ROW EXECUTE FUNCTION make_group_code();

EOSQL
