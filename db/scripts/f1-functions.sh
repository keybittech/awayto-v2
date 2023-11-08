#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  DROP SCHEMA IF EXISTS dbfunc_schema CASCADE;
  CREATE SCHEMA dbfunc_schema;

  CREATE OR REPLACE FUNCTION dbfunc_schema.delete_group(
    sub UUID  
  ) RETURNS TABLE (
    id UUID
  ) AS $$
  BEGIN

    RETURN QUERY
    DELETE FROM dbtable_schema.groups WHERE created_sub = sub
    RETURNING dbtable_schema.groups.id;

  END;
  $$ LANGUAGE PLPGSQL;

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
        slot."startTime"::INTERVAL as start_time,
        slot.id as schedule_bracket_slot_id,
        schedule.timezone as schedule_timezone
      FROM generate_series(
        DATE_TRUNC('week', p_month_start_date::DATE + INTERVAL '1 day') - INTERVAL '1 day',
        DATE_TRUNC('week', p_month_start_date::DATE + INTERVAL '1 day') - INTERVAL '1 day' + INTERVAL '1 month',
        interval '1 week'
      ) AS week_start
      CROSS JOIN dbview_schema.enabled_schedule_bracket_slots slot
      LEFT JOIN dbtable_schema.bookings booking ON booking.schedule_bracket_slot_id = slot.id AND DATE_TRUNC('week', booking.slot_date + INTERVAL '1 day') - INTERVAL '1 DAY' = week_start
      LEFT JOIN dbtable_schema.schedule_bracket_slot_exclusions exclusion ON exclusion.schedule_bracket_slot_id = slot.id AND DATE_TRUNC('week', exclusion.exclusion_date + INTERVAL '1 day') - INTERVAL '1 DAY' = week_start
      JOIN dbtable_schema.schedule_brackets bracket ON bracket.id = slot."scheduleBracketId"
      JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = bracket.schedule_id
      JOIN dbtable_schema.schedules schedule ON schedule.id = gus.group_schedule_id
      WHERE
        booking.id IS NULL AND
        exclusion.id IS NULL AND
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

  CREATE OR REPLACE FUNCTION dbfunc_schema.get_scheduled_parts (
    p_schedule_id UUID
  )
  RETURNS TABLE (
    partType TEXT,
    ids JSONB
  )  AS $$
  BEGIN
  RETURN QUERY
    SELECT DISTINCT 'slot', JSONB_AGG(sl.id)
    FROM dbtable_schema.schedule_bracket_slots sl
    JOIN dbtable_schema.schedule_brackets bracket ON bracket.id = sl.schedule_bracket_id
    JOIN dbtable_schema.schedules schedule ON schedule.id = bracket.schedule_id
    LEFT JOIN dbtable_schema.quotes quote ON quote.schedule_bracket_slot_id = sl.id
    WHERE schedule.id = p_schedule_id AND quote.id IS NOT NULL
    UNION
    SELECT DISTINCT 'service', JSONB_AGG(se.id)
    FROM dbtable_schema.schedule_bracket_services se
    JOIN dbtable_schema.schedule_brackets bracket ON bracket.id = se.schedule_bracket_id
    JOIN dbtable_schema.schedules schedule ON schedule.id = bracket.schedule_id
    JOIN dbtable_schema.services service ON service.id = se.service_id
    JOIN dbtable_schema.service_tiers tier ON tier.service_id = service.id
    LEFT JOIN dbtable_schema.quotes quote ON quote.service_tier_id = tier.id
    JOIN dbtable_schema.schedule_bracket_slots slot ON slot.id = quote.schedule_bracket_slot_id 
    WHERE schedule.id = p_schedule_id
    AND slot.schedule_bracket_id = bracket.id
    AND quote.id IS NOT NULL;
  END;
  $$ LANGUAGE PLPGSQL;

  CREATE OR REPLACE FUNCTION dbfunc_schema.get_peer_schedule_replacement (
    p_user_schedule_ids UUID[],
    p_slot_date DATE,
    p_start_time INTERVAL,
    p_tier_name TEXT
  )
  RETURNS TABLE (
    replacement JSON
  )  AS $$
  BEGIN
  RETURN QUERY
    SELECT JSON_BUILD_OBJECT(
      'username', usr.username,
      'scheduleBracketSlotId', repslot.id,
      'startTime', repslot.start_time::TEXT,
      'serviceTierId', reptier.id
    ) as replacement
    FROM
      dbtable_schema.group_user_schedules user_sched
    JOIN dbtable_schema.group_user_schedules peer_sched ON peer_sched.group_schedule_id = user_sched.group_schedule_id AND peer_sched.user_schedule_id <> ALL(p_user_schedule_ids::UUID[])
    JOIN dbtable_schema.schedule_brackets repbrac ON repbrac.schedule_id = peer_sched.user_schedule_id
    JOIN dbtable_schema.schedule_bracket_slots repslot ON repslot.schedule_bracket_id = repbrac.id
    JOIN dbtable_schema.schedule_bracket_services repserv ON repserv.schedule_bracket_id = repbrac.id
    JOIN dbtable_schema.service_tiers reptier ON reptier.service_id = repserv.service_id
    JOIN dbtable_schema.users usr ON usr.sub = repslot.created_sub
    LEFT JOIN dbtable_schema.quotes repq ON repq.schedule_bracket_slot_id = repslot.id AND repq.slot_date = p_slot_date AND repq.enabled = true
    WHERE user_sched.user_schedule_id = ANY(p_user_schedule_ids::UUID[])
      AND repslot.start_time = p_start_time
      AND reptier.name = p_tier_name
      AND repq.id IS NULL
      AND repslot.enabled = true
    LIMIT 1;
  END;
  $$ LANGUAGE PLPGSQL;

EOSQL