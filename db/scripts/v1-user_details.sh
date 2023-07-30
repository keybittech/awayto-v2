#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

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
            eq."createdOn"
          FROM dbview_schema.enabled_quotes eq
          JOIN dbtable_schema.quotes q ON q.id = eq.id
          JOIN dbtable_schema.users us ON us.sub = q.created_sub
          JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eq."scheduleBracketSlotId"
          JOIN dbview_schema.enabled_schedule_brackets esb ON esb.id = sbs.schedule_bracket_id
          JOIN dbview_schema.enabled_schedules schedule ON schedule.id = esb."scheduleId"
          LEFT JOIN dbtable_schema.bookings b ON b.quote_id = q.id
          WHERE sbs.created_sub = u.sub AND b.id IS NULL
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
          JOIN dbtable_schema.bookings b ON b.id = eb.id
          JOIN dbtable_schema.quotes q ON q.id = b.quote_id 
          JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs.id = eb."scheduleBracketSlotId"
          JOIN dbview_schema.enabled_schedule_brackets esb ON esb.id = esbs."scheduleBracketId"
          JOIN dbview_schema.enabled_schedules schedule ON schedule.id = esb."scheduleId"
          WHERE b.created_sub = u.sub OR q.created_sub = u.sub
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
            dbview_schema.enabled_user_roles eur
            JOIN dbview_schema.enabled_roles er ON eur."roleId" = er.id
          WHERE
            eur."userId" = u.id
        ) r
    ) as rols ON true
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(g.id, JSONB_STRIP_NULLS(TO_JSONB(g))) as groups
      FROM
        (
          SELECT
            eg.*,
            CASE WHEN u.sub = g.created_sub THEN true ELSE null END ldr
          FROM
            dbview_schema.enabled_group_users egu
            JOIN dbview_schema.enabled_groups eg ON egu."groupId" = eg.id
            JOIN dbtable_schema.groups g ON g.id = eg.id
          WHERE
            egu."userId" = u.id
        ) g
    ) as grps ON true;

EOSQL


  