#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  \ c sysmaindb 

  CREATE
  OR REPLACE VIEW enabled_budgets AS
  SELECT
    id,
    name,
    row_number() OVER () as row
  FROM
    budgets
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_timelines AS
  SELECT
    id,
    name,
    row_number() OVER () as row
  FROM
    timelines
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_services AS
  SELECT
    id,
    name,
    cost,
    row_number() OVER () as row
  FROM
    services
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_service_addons AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    service_addon_id as "serviceAddonId",
    row_number() OVER () as row
  FROM
    uuid_service_addons
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_services AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    service_id as "serviceId",
    row_number() OVER () as row
  FROM
    uuid_services
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_service_addons AS
  SELECT
    id,
    name,
    row_number() OVER () as row
  FROM
    service_addons
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_service_tiers AS
  SELECT
    id,
    name,
    service_id as "serviceId",
    multiplier,
    row_number() OVER () as row
  FROM
    service_tiers
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_contacts AS
  SELECT
    id,
    name,
    email,
    phone,
    row_number() OVER () as row
  FROM
    contacts
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_schedules AS
  SELECT
    id,
    name,
    overbook,
    row_number() OVER () as row
  FROM
    schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_schedules AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    schedule_id as "scheduleId",
    row_number() OVER () as row
  FROM
    uuid_schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_schedule_terms AS
  SELECT
    st.id,
    st.schedule_id as "scheduleId",
    st.schedule_context_id as "scheduleContextId",
    sc.name as "scheduleContextName",
    st.duration,
    row_number() OVER () as row
  FROM
    schedule_terms st
    LEFT JOIN schedule_contexts sc ON st.schedule_context_id = sc.id
  WHERE
    st.enabled = true;

  CREATE
  OR REPLACE VIEW enabled_schedule_brackets AS
  SELECT
    sb.id,
    sb.schedule_id as "scheduleId",
    sb.schedule_context_id as "scheduleContextId",
    sc.name as "scheduleContextName",
    sb.bracket,
    sb.multiplier,
    row_number() OVER () as row
  FROM
    schedule_brackets sb
    LEFT JOIN schedule_contexts sc ON sb.schedule_context_id = sc.id
  WHERE
    sb.enabled = true;

  CREATE
  OR REPLACE VIEW enabled_quotes AS
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
    row_number() OVER () as row
  FROM
    quotes
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_quotes AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    quote_id as "quoteId",
    row_number() OVER () as row
  FROM
    uuid_quotes
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_payments AS
  SELECT
    id,
    contact_id as "contactId",
    details,
    row_number() OVER () as row
  FROM
    payments
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_payments AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    payment_id as "paymentId",
    row_number() OVER () as row
  FROM
    uuid_payments
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_bookings AS
  SELECT
    id,
    service_tier_id as "serviceTierId",
    contact_id as "contactId",
    payment_id as "paymentId",
    agreement,
    description,
    row_number() OVER () as row
  FROM
    bookings
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_uuid_bookings AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    booking_id as "bookingId",
    row_number() OVER () as row
  FROM
    uuid_bookings
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_booking_schedule_brackets AS
  SELECT
    id,
    booking_id as "bookingId",
    schedule_bracket_id as "scheduleBracketId",
    duration,
    row_number() OVER () as row
  FROM
    booking_schedule_brackets
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW enabled_service_tiers_ext AS
  SELECT
    est.*,
    essa.* as addons
  FROM
    enabled_service_tiers est
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
            LEFT JOIN enabled_service_addons esa ON esa.id = sta.service_addon_id
          WHERE
            sta.service_tier_id = est.id
        ) s1
    ) as essa ON true;

  CREATE
  OR REPLACE VIEW enabled_services_ext AS
  SELECT
    es.*,
    eest.* as tiers
  FROM
    enabled_services es
    LEFT JOIN LATERAL (
      SELECT
        JSON_AGG(s1.*) as tiers
      FROM
        (
          SELECT
            este.*
          FROM
            enabled_service_tiers_ext este
          WHERE
            este."serviceId" = es.id
        ) s1
    ) as eest ON true;

  CREATE
  OR REPLACE VIEW enabled_schedules_ext AS
  SELECT
    es.*,
    row_to_json(est.*) term,
    eesb.*,
    eess.*
  FROM
    enabled_schedules es
    LEFT JOIN enabled_schedule_terms est ON est."scheduleId" = es.id
    LEFT JOIN LATERAL (
      SELECT
        JSON_AGG(s2.*) as brackets
      FROM
        (
          SELECT
            esb.*
          FROM
            enabled_schedule_brackets esb
          WHERE
            esb."scheduleId" = es.id
        ) s2
    ) as eesb ON true
    LEFT JOIN LATERAL (
      SELECT
        JSON_AGG(s3.*) as services
      FROM
        (
          SELECT
            ess.*
          FROM
            schedule_services ss
            LEFT JOIN enabled_services_ext ess ON ess.id = ss.service_id
          WHERE
            ss.schedule_id = es.id
        ) s3
    ) as eess ON true;

  CREATE
  OR REPLACE VIEW enabled_quotes_ext AS
  SELECT
    eq.*,
    eb.name as "budgetName",
    et.name as "timelineName",
    row_to_json(es.*) as "serviceTier",
    row_to_json(s.*) as service,
    row_to_json(ec.*) as contact
  FROM
    enabled_quotes eq
    LEFT JOIN enabled_budgets eb ON eb.id = eq."budgetId"
    LEFT JOIN enabled_timelines et ON et.id = eq."timelineId"
    LEFT JOIN enabled_service_tiers es ON es.id = eq."serviceTierId"
    LEFT JOIN enabled_services s ON s.id = es."serviceId"
    LEFT JOIN enabled_contacts ec ON ec.id = eq."contactId";

  CREATE
  OR REPLACE VIEW enabled_bookings_ext AS
  SELECT
    eb.*,
    row_to_json(es.*) as service,
    row_to_json(est.*) as tier,
    row_to_json(ep.*) as payment,
    row_to_json(ec.*) as contact,
    eess.* as brackets
  FROM
    enabled_bookings eb
    LEFT JOIN enabled_service_tiers est ON est.id = eb."serviceTierId"
    LEFT JOIN enabled_services es ON es.id = est."serviceId"
    LEFT JOIN enabled_payments ep ON ep.id = eb."paymentId"
    LEFT JOIN enabled_contacts ec ON ec.id = eb."contactId"
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
            LEFT JOIN enabled_schedule_brackets esb ON bsb.schedule_bracket_id = esb.id
          WHERE
            bsb.booking_id = eb.id
        ) s1
    ) as eess ON true;

EOSQL