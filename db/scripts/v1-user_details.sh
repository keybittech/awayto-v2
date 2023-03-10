#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

	\c sysmaindb

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_users_ext AS
  SELECT
    u.*,
    grps.* as groups,
    rols.* as roles,
    quos.* as quotes,
    boks.* as bookings
  FROM
    dbview_schema.enabled_users u
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(q.id, TO_JSONB(q)) as quotes
      FROM
        (
          SELECT
            eq.id,
            eq."slotDate",
            eq."startTime",
            eq."scheduleBracketSlotId",
            eq."serviceTierName",
            eq."serviceName",
            eq."createdOn",
            us.username
          FROM dbview_schema.enabled_quotes eq
          JOIN dbtable_schema.users us ON us.sub = eq."createdSub"
          JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eq."scheduleBracketSlotId"
          JOIN dbview_schema.enabled_schedule_brackets esb ON esb.id = sbs.schedule_bracket_id
          JOIN dbview_schema.enabled_schedules schedule ON schedule.id = esb."scheduleId"
          WHERE sbs.created_sub = u.sub
        ) q
    ) as quos on true
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(b.id, TO_JSONB(b)) as bookings
      FROM
        (
          SELECT
            eb.id,
            eb."slotDate",
            eb."startTime",
            eb."serviceTierName",
            eb."serviceName",
            eb."createdOn"
          FROM dbview_schema.enabled_bookings eb
          JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs.id = eb."scheduleBracketSlotId"
          JOIN dbview_schema.enabled_schedule_brackets esb ON esb.id = esbs."scheduleBracketId"
          JOIN dbview_schema.enabled_schedules schedule ON schedule.id = esb."scheduleId"
          WHERE eb."createdSub" = u.sub OR eb."quoteSub" = u.sub
        ) b
    ) as boks on true
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(r.id, TO_JSONB(r)) as roles
      FROM
        (
          SELECT
            er.*
          FROM
            dbview_schema.enabled_uuid_roles eur
            JOIN dbview_schema.enabled_roles er ON eur."roleId" = er.id
          WHERE
            eur."parentUuid" = u.id
        ) r
    ) as rols ON true
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(g.id, TO_JSONB(g)) as groups
      FROM
        (
          SELECT
            ege.*
          FROM
            dbview_schema.enabled_uuid_groups eug
            JOIN dbview_schema.enabled_groups_ext ege ON eug."groupId" = ege.id
          WHERE
            eug."parentUuid" = u.id
        ) g
    ) as grps ON true;

EOSQL


  