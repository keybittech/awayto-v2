#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

	\c sysmaindb

  DROP SCHEMA IF EXISTS dbfunc_schema CASCADE;
  CREATE SCHEMA dbfunc_schema;

	CREATE FUNCTION dbfunc_schema.get_group_schedules(
		p_month_date DATE, 
		p_schedule_id UUID, 
		p_client_timezone TEXT
	) RETURNS TABLE (
		"weekStart" DATE,
		"startDate" DATE,
		"startTime" TEXT,
		"scheduleBracketSlotId" UUID
	)	AS $$
	BEGIN
		RETURN QUERY
		WITH slots AS (
			SELECT
				generate_series(
					date_trunc('week', p_month_date) - INTERVAL '1 day',
					date_trunc('week', p_month_date) - INTERVAL '1 day' + INTERVAL '1 month',
					INTERVAL '1 WEEK'
				) AT TIME ZONE 'UTC' AT TIME ZONE s.timezone week_start,
				sbs.start_time,
				sbs.id AS schedule_bracket_slot_id,
				s.timezone
			FROM dbtable_schema.schedule_bracket_slots sbs
			JOIN dbtable_schema.schedule_brackets sb ON sbs.schedule_bracket_id = sb.id
			JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = sb.schedule_id
			JOIN dbtable_schema.schedules s ON s.id = gus.group_schedule_id
			WHERE s.id = p_schedule_id
		)
		SELECT
			slts.week_start::DATE as "weekStart",
			(
				(
					TO_TIMESTAMP((slts.week_start + slts.start_time)::TEXT, 'YYYY-MM-DD HH24:MI') AT TIME ZONE p_client_timezone - 
					TO_TIMESTAMP((slts.week_start + slts.start_time)::TEXT, 'YYYY-MM-DD HH24:MI') AT TIME ZONE slts.timezone
				)::INTERVAL + slts.start_time::INTERVAL + slts.week_start::DATE
			)::DATE as "startDate",
			(
				(
					TO_TIMESTAMP((slts.week_start + slts.start_time)::TEXT, 'YYYY-MM-DD HH24:MI') AT TIME ZONE p_client_timezone - 
					TO_TIMESTAMP((slts.week_start + slts.start_time)::TEXT, 'YYYY-MM-DD HH24:MI') AT TIME ZONE slts.timezone
				)::INTERVAL + slts.start_time
			)::TEXT as "startTime",
			slts.schedule_bracket_slot_id as "scheduleBracketSlotId"
		FROM 
			slots slts
		LEFT JOIN
			dbtable_schema.quotes q ON q.schedule_bracket_slot_id = slts.schedule_bracket_slot_id
			AND (
				q.slot_date AT TIME ZONE 'UTC' AT TIME ZONE slts.timezone AT TIME ZONE p_client_timezone AT TIME ZONE 'UTC' + slts.start_time
			) BETWEEN
				slts.week_start
				AND slts.week_start + INTERVAL '1 week'
		WHERE 
			q.id IS NULL
			AND slts.week_start > (date_trunc('day', NOW()) - INTERVAL '1 day')
		ORDER BY
			"weekStart",
			(slts.week_start + slts.start_time);
	END;
	$$ LANGUAGE PLPGSQL;

	CREATE FUNCTION dbfunc_schema.make_group_code() RETURNS TRIGGER 
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

EOSQL