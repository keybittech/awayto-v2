#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  \ c sysmaindb 

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_budgets AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    budgets
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
    timelines
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
    services
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
    uuid_service_addons
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
    uuid_services
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
    service_addons
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
    service_tiers
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
    contacts
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedules AS
  SELECT
    id,
    name,
    schedule_context_id as "scheduleContextId",
    duration,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    schedules
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
    uuid_schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedule_brackets AS
  SELECT
    sb.id,
    sb.schedule_id as "scheduleId",
    sb.schedule_context_id as "scheduleContextId",
    sc.name as "scheduleContextName",
    sb.bracket_duration as "bracketDuration",
    sb.automatic,
    sb.multiplier,
    sb.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    schedule_brackets sb
    LEFT JOIN schedule_contexts sc ON sb.schedule_context_id = sc.id
  WHERE
    sb.enabled = true;

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
    quotes
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
    uuid_quotes
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
    payments
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
    uuid_payments
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
    bookings
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
    uuid_bookings
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
    booking_schedule_brackets
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
        JSON_AGG(s1.*) as addons
      FROM
        (
          SELECT
            esa.id,
            esa.name
          FROM
            service_tier_addons sta
            LEFT JOIN dbview_schema.enabled_service_addons esa ON esa.id = sta.service_addon_id
          WHERE
            sta.service_tier_id = est.id
        ) s1
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
        JSON_AGG(s1.*) as tiers
      FROM
        (
          SELECT
            este.*
          FROM
            dbview_schema.enabled_service_tiers_ext este
          WHERE
            este."serviceId" = es.id
        ) s1
    ) as eest ON true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_schedules_ext AS
  SELECT
    es.*,
    eesb.*
  FROM
    dbview_schema.enabled_schedules es
    LEFT JOIN LATERAL (
      SELECT
        JSON_AGG(s2.*) as brackets
      FROM
        (
          SELECT
            esb.*,
            eess.*
          FROM
            dbview_schema.enabled_schedule_brackets esb
            LEFT JOIN LATERAL (
              SELECT
                JSON_AGG(s3.*) as services
              FROM
                (
                  SELECT
                    ese.*
                  FROM
                    schedule_bracket_services sbs
                    LEFT JOIN dbview_schema.enabled_services_ext ese ON ese.id = sbs.service_id
                  WHERE
                    sbs.schedule_bracket_id = esb.id
                ) s3
            ) as eess ON true
          WHERE
            esb."scheduleId" = es.id
        ) s2
    ) as eesb ON true;

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
        JSON_AGG(s1.*) as brackets
      FROM
        (
          SELECT
            esb.*,
            bsb.duration
          FROM
            booking_schedule_brackets bsb
            LEFT JOIN dbview_schema.enabled_schedule_brackets esb ON bsb.schedule_bracket_id = esb.id
          WHERE
            bsb.booking_id = eb.id
        ) s1
    ) as eess ON true;

EOSQL