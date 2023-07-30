#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  CREATE
  OR REPLACE VIEW dbview_schema.group_user_schedule_stubs AS
  SELECT
    brac.schedule_id as "userScheduleId",
    q.id as "quoteId",
    q.slot_date as "slotDate",
    sbs.start_time::TEXT as "startTime",
    serv.name as "serviceName",
    t.name as "tierName",
    rep.*
  FROM
    dbtable_schema.quotes q
    JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = q.schedule_bracket_slot_id
    JOIN dbtable_schema.service_tiers t ON t.id = q.service_tier_id
    JOIN dbtable_schema.services serv ON serv.id = t.service_id
    JOIN dbtable_schema.schedule_brackets brac ON brac.id = sbs.schedule_bracket_id
    LEFT JOIN LATERAL (
      SELECT replacement FROM dbfunc_schema.get_peer_schedule_replacement(
        ARRAY(SELECT id FROM dbtable_schema.schedules WHERE id = brac.schedule_id),
        q.slot_date,
        sbs.start_time,
        t.name
      )
    ) rep ON true
  WHERE
    sbs.enabled = false;

EOSQL
