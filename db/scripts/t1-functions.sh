#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb

  DROP SCHEMA IF EXISTS dbfunc_schema CASCADE;
  CREATE SCHEMA dbfunc_schema;

  CREATE OR REPLACE FUNCTION dbfunc_schema.get_group_schedules(
    p_month_start_date DATE, 
    p_schedule_id UUID, 
    p_client_timezone TEXT
  ) RETURNS TABLE (
    "weekStart" DATE,
    "startDate" DATE,
    "startTime" TEXT,
    "scheduleBracketSlotId" UUID
  )  AS $$
  BEGIN
    RETURN QUERY
    WITH series AS (
      SELECT
        week_start::DATE,
        slot.start_time,
        slot.id as schedule_bracket_slot_id,
        schedule.timezone as schedule_timezone
      FROM generate_series(
        DATE_TRUNC('week', p_month_start_date::DATE) - INTERVAL '1 day',
        DATE_TRUNC('week', p_month_start_date::DATE) - INTERVAL '1 day' + INTERVAL '1 month',
        interval '1 week'
      ) AS week_start
      CROSS JOIN dbtable_schema.schedule_bracket_slots slot
      LEFT JOIN dbtable_schema.schedule_bracket_slot_exclusions exclusion ON exclusion.schedule_bracket_slot_id = slot.id
      JOIN dbtable_schema.schedule_brackets bracket ON bracket.id = slot.schedule_bracket_id
      JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = bracket.schedule_id
      JOIN dbtable_schema.schedules schedule ON schedule.id = gus.group_schedule_id
      LEFT JOIN dbtable_schema.bookings booking ON booking.schedule_bracket_slot_id = slot.id AND 
				DATE_TRUNC('week', booking.slot_date) = DATE_TRUNC('week', week_start)
      WHERE
        exclusion.id IS NULL AND
        booking.id IS NULL AND
        schedule.id = p_schedule_id
    ), timers AS (
      SELECT
        series.*,
        TIMEZONE(p_client_timezone, NOW()) - TIMEZONE(schedule_timezone, NOW()) as client_offset,
        (DATE_TRUNC('day', week_start::timestamp) + start_time)::TIMESTAMP AT TIME ZONE schedule_timezone AS scheduler_start_time,
        (DATE_TRUNC('day', week_start::timestamp) + start_time + interval '1 hour')::TIMESTAMP AT TIME ZONE schedule_timezone AS scheduler_start_time_dst_check
      FROM
        series
    )
    SELECT 
      CASE
        WHEN start_time + client_offset < INTERVAL '0 days'
        THEN week_start - INTERVAL '1 week'
        ELSE week_start
      END::DATE as "weekStart",
      CASE
        WHEN start_time + client_offset < INTERVAL '0 days'
        THEN week_start - INTERVAL '1 week' + start_time + client_offset + INTERVAL '1 week'
        ELSE week_start + start_time + client_offset
      END::DATE as "startDate",
      CASE
        WHEN start_time + client_offset < INTERVAL '0 days'
        THEN start_time + client_offset + INTERVAL '1 week'
        ELSE start_time + client_offset
      END::TEXT as "startTime",
      schedule_bracket_slot_id as "scheduleBracketSlotId"
    FROM timers
    WHERE 
      scheduler_start_time >= TIMEZONE(schedule_timezone, NOW()) AND
      scheduler_start_time <> scheduler_start_time_dst_check
    ORDER BY week_start, start_time;
  END;
  $$ LANGUAGE PLPGSQL;

  CREATE OR REPLACE FUNCTION dbfunc_schema.make_group_code() RETURNS TRIGGER 
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