#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb 

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_budgets AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.budgets
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_timelines AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.timelines
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_services AS
  SELECT
    id,
    name,
    cost,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.services
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_service_addons AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    service_addon_id as "serviceAddonId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_service_addons
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_services AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    service_id as "serviceId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_services
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_service_addons AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.service_addons
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_service_tiers AS
  SELECT
    id,
    name,
    service_id as "serviceId",
    multiplier,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.service_tiers
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_contacts AS
  SELECT
    id,
    name,
    email,
    phone,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.contacts
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedules AS
  SELECT
    id,
    name,
    duration,
    schedule_time_unit_id as "scheduleTimeUnitId",
    bracket_time_unit_id as "bracketTimeUnitId",
    slot_time_unit_id as "slotTimeUnitId",
    slot_duration as "slotDuration",
    created_sub as "createdSub",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_schedules AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    schedule_id as "scheduleId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedule_brackets AS
  SELECT
    sb.id,
    sb.schedule_id as "scheduleId",
    sb.duration,
    sb.multiplier,
    sb.automatic,
    sb.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.schedule_brackets sb
  WHERE
    sb.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedule_bracket_slots AS
  SELECT
    id,
    schedule_bracket_id as "scheduleBracketId",
    start_time as "startTime",
    row_number() OVER () as row
  FROM
    dbtable_schema.schedule_bracket_slots
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_quotes AS
  SELECT
    id,
    name,
    description,
    budget_id as "budgetId",
    timeline_id as "timelineId",
    service_tier_id as "serviceTierId",
    contact_id as "contactId",
    desired_duration as "desiredDuration",
    respond_by as "respondBy",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.quotes
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_quotes AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    quote_id as "quoteId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_quotes
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_payments AS
  SELECT
    id,
    contact_id as "contactId",
    details,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.payments
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_payments AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    payment_id as "paymentId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_payments
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_bookings AS
  SELECT
    id,
    service_tier_id as "serviceTierId",
    contact_id as "contactId",
    payment_id as "paymentId",
    agreement,
    description,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.bookings
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_bookings AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    booking_id as "bookingId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_bookings
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_booking_schedule_brackets AS
  SELECT
    id,
    booking_id as "bookingId",
    schedule_bracket_id as "scheduleBracketId",
    duration,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.booking_schedule_brackets
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_service_tiers_ext AS
  SELECT
    est.*,
    essa.* as addons
  FROM
    dbview_schema.enabled_service_tiers est
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(soa.id, TO_JSONB(soa)) as addons
      FROM
        (
          SELECT
            esa.id,
            esa.name,
            sta.created_on as "createdOn"
          FROM
            dbtable_schema.service_tier_addons sta
            LEFT JOIN dbview_schema.enabled_service_addons esa ON esa.id = sta.service_addon_id
          WHERE
            sta.service_tier_id = est.id
          ORDER BY sta.created_on ASC
        ) soa
    ) as essa ON true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_services_ext AS
  SELECT
    es.*,
    eest.* as tiers
  FROM
    dbview_schema.enabled_services es
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(soa.id, TO_JSONB(soa)) as tiers
      FROM
        (
          SELECT
            este.*
          FROM
            dbview_schema.enabled_service_tiers_ext este
          WHERE
            este."serviceId" = es.id
        ) soa
    ) as eest ON true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedules_ext AS
  SELECT
    es.*,
    eesb.* as brackets
  FROM
    dbview_schema.enabled_schedules es
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(sbss.id, TO_JSONB(sbss)) as brackets
      FROM
        (
          SELECT
            esb.*,
            eess.* as services,
            eesl.* as slots
          FROM
            dbview_schema.enabled_schedule_brackets esb
            LEFT JOIN LATERAL (
              SELECT
                JSONB_OBJECT_AGG(servs.id, TO_JSONB(servs)) as services
              FROM
                (
                  SELECT
                    ese.*
                  FROM
                    dbtable_schema.schedule_bracket_services sbs
                    LEFT JOIN dbview_schema.enabled_services_ext ese ON ese.id = sbs.service_id
                  WHERE
                    sbs.schedule_bracket_id = esb.id
                ) servs
            ) as eess ON true
            LEFT JOIN LATERAL (
              SELECT
                JSONB_OBJECT_AGG(slts.id, TO_JSONB(slts)) as slots
              FROM
                (
                  SELECT
                    esbs.*
                  FROM
                    dbview_schema.enabled_schedule_bracket_slots esbs
                  WHERE
                    esbs."scheduleBracketId" = esb.id
                ) slts
            ) as eesl ON true
          WHERE
            esb."scheduleId" = es.id
        ) sbss
    ) as eesb ON true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_schedules_ext AS
  SELECT
    eg.id as "groupId",
    eslts.* as slots
  FROM
    dbview_schema.enabled_groups eg
  LEFT JOIN dbview_schema.enabled_uuid_schedules msch ON msch."parentUuid" = eg.id
  LEFT JOIN LATERAL (
    SELECT
      JSONB_OBJECT_AGG(esbs.id, TO_JSONB(esbs)) as slots
    FROM
      dbview_schema.enabled_uuid_schedules csch
      LEFT JOIN dbview_schema.enabled_schedule_brackets esb ON esb."scheduleId" = csch."scheduleId"
      LEFT JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs."scheduleBracketId" = esb.id
    WHERE
      csch."parentUuid" = msch."scheduleId"
    UNION
    SELECT
      JSONB_OBJECT_AGG(esbs.id, TO_JSONB(esbs)) as slots
    FROM
      dbview_schema.enabled_schedule_brackets esb
      LEFT JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs."scheduleBracketId" = esb.id
    WHERE
      esb."scheduleId" = msch."scheduleId"
  ) as eslts ON true;

  

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_quotes_ext AS
  SELECT
    eq.*,
    eb.name as "budgetName",
    et.name as "timelineName",
    row_to_json(es.*) as "serviceTier",
    row_to_json(s.*) as service,
    row_to_json(ec.*) as contact
  FROM
    dbview_schema.enabled_quotes eq
    LEFT JOIN dbview_schema.enabled_budgets eb ON eb.id = eq."budgetId"
    LEFT JOIN dbview_schema.enabled_timelines et ON et.id = eq."timelineId"
    LEFT JOIN dbview_schema.enabled_service_tiers es ON es.id = eq."serviceTierId"
    LEFT JOIN dbview_schema.enabled_services s ON s.id = es."serviceId"
    LEFT JOIN dbview_schema.enabled_contacts ec ON ec.id = eq."contactId";

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_bookings_ext AS
  SELECT
    eb.*,
    row_to_json(es.*) as service,
    row_to_json(est.*) as tier,
    row_to_json(ep.*) as payment,
    row_to_json(ec.*) as contact,
    eess.* as brackets
  FROM
    dbview_schema.enabled_bookings eb
    LEFT JOIN dbview_schema.enabled_service_tiers est ON est.id = eb."serviceTierId"
    LEFT JOIN dbview_schema.enabled_services es ON es.id = est."serviceId"
    LEFT JOIN dbview_schema.enabled_payments ep ON ep.id = eb."paymentId"
    LEFT JOIN dbview_schema.enabled_contacts ec ON ec.id = eb."contactId"
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(bbs.id, TO_JSONB(bbs)) as brackets
      FROM
        (
          SELECT
            esb.*,
            bsb.duration
          FROM
            dbtable_schema.booking_schedule_brackets bsb
            LEFT JOIN dbview_schema.enabled_schedule_brackets esb ON bsb.schedule_bracket_id = esb.id
          WHERE
            bsb.booking_id = eb.id
        ) bbs
    ) as eess ON true;

EOSQL