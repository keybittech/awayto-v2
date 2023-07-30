#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  CREATE OR REPLACE VIEW dbview_schema.distinct_schedule_slots AS
  SELECT DISTINCT
    gus.group_schedule_id,
    sbs.start_time,
    ROW_NUMBER() OVER () as rowNum
  FROM
    dbtable_schema.schedule_bracket_slots sbs
  JOIN dbtable_schema.schedule_brackets sb ON sb.id = sbs.schedule_bracket_id
  JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = sb.schedule_id
  GROUP BY
    gus.group_schedule_id, sbs.start_time;


  DROP MATERIALIZED VIEW IF EXISTS dbview_schema.kiosk_schedule;

  CREATE MATERIALIZED VIEW dbview_schema.kiosk_schedule AS
  SELECT
    g.name,
    g.code,
    JSONB_OBJECT_AGG(schedules.name, TO_JSONB(schedules.*)) as schedules
  FROM dbtable_schema.groups g
  LEFT JOIN LATERAL (
    SELECT 
      s.name,
      s.slot_duration as "slotDuration",
      scheduleTimeUnit.name as "scheduleTimeUnitName",
      bracketTimeUnit.name as "bracketTimeUnitName",
      slotTimeUnit.name as "slotTimeUnitName",
      JSONB_OBJECT_AGG('all', dcsc) as brackets,
      sbss.services
    FROM dbview_schema.enabled_group_schedules egs
    JOIN dbtable_schema.group_user_schedules gus ON gus.group_schedule_id = egs."scheduleId"
    JOIN dbtable_schema.schedules s ON s.id = gus.user_schedule_id
    JOIN dbtable_schema.time_units scheduleTimeUnit ON scheduleTimeUnit.id = s.schedule_time_unit_id
    JOIN dbtable_schema.time_units bracketTimeUnit ON bracketTimeUnit.id = s.bracket_time_unit_id
    JOIN dbtable_schema.time_units slotTimeUnit ON slotTimeUnit.id = s.slot_time_unit_id
    JOIN dbtable_schema.schedule_brackets sb ON sb.schedule_id = gus.user_schedule_id
    LEFT JOIN LATERAL (
      SELECT
        ARRAY_AGG(JSONB_BUILD_OBJECT('name', s.name)) as services
      FROM
        dbtable_schema.schedule_bracket_services sbs
        JOIN dbview_schema.enabled_services s ON s.id = sbs.service_id
      WHERE
        sbs.schedule_bracket_id = sb.id
    ) as sbss ON true
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(dss.rowNum, JSONB_BUILD_OBJECT('startTime', dss.start_time)) as slots
      FROM
        dbview_schema.distinct_schedule_slots dss 
      WHERE
        dss.group_schedule_id = egs."scheduleId"
    ) as dcsc ON true
    WHERE egs."groupId" = g.id AND dcsc.slots IS NOT NULL
    GROUP BY s.name, s.slot_duration, sbss.services, scheduleTimeUnit.name, bracketTimeUnit.name, slotTimeUnit.name
  ) as schedules ON true
  GROUP BY g.name, g.code;

  CREATE UNIQUE INDEX ON dbview_schema.kiosk_schedule (name);

EOSQL