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
  OR REPLACE VIEW dbview_schema.enabled_forms AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.forms
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_forms AS
  SELECT
    id,
    group_id as "groupId",
    form_id as "formId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_forms
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_form_versions AS
  SELECT
    id,
    form,
    form_id as "formId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.form_versions
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_form_version_submissions AS
  SELECT
    id,
    submission,
    form_version_id as "formVersionId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.form_version_submissions
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_services AS
  SELECT
    id,
    name,
    cost,
    form_id as "formId",
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
  OR REPLACE VIEW dbview_schema.enabled_group_services AS
  SELECT
    id,
    group_id as "groupId",
    service_id as "serviceId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_services
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
    service_id as "serviceId",
    form_id as "formId",
    name,
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
    start_time as "startTime",
    end_time as "endTime",
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
  OR REPLACE VIEW dbview_schema.enabled_group_schedules AS
  SELECT
    id,
    group_id as "groupId",
    schedule_id as "scheduleId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_schedules
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_user_schedules AS
  SELECT
    id,
    group_schedule_id as "groupScheduleId",
    user_schedule_id as "userScheduleId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_user_schedules
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
    sb.created_sub as "createdSub",
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
    slot_date as "slotDate",
    schedule_bracket_slot_id as "scheduleBracketSlotId",
    service_tier_id as "serviceTierId",
    service_form_version_submission_id as "serviceFormVersionSubmissionId",
    tier_form_version_submission_id as "tierFormVersionSubmissionId",
    created_sub as "createdSub",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.quotes
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_bookings AS
  SELECT
    id,
    slot_date as "slotDate",
    quote_id as "quoteId",
    schedule_bracket_slot_id as "scheduleBracketSlotId",
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.bookings
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
  OR REPLACE VIEW dbview_schema.enabled_schedule_brackets_ext AS
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
    ) as eesl ON true;

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
            esbe.*
          FROM
            dbview_schema.enabled_schedule_brackets_ext esbe
          WHERE
            esbe."scheduleId" = es.id
        ) sbss
    ) as eesb ON true;  

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_quotes_ext AS
  SELECT
    eq.id,
    eq."slotDate",
    row_to_json(esbs.*) as "scheduleBracketSlot",
    row_to_json(est.*) as "serviceTier",
    row_to_json(sform.*) as "serviceFormVersionSubmission",
    row_to_json(tform.*) as "tierFormVersionSubmission",
    eq."createdOn",
    eq."createdSub"
  FROM
    dbview_schema.enabled_quotes eq
    LEFT JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs.id = eq."scheduleBracketSlotId"
    LEFT JOIN dbview_schema.enabled_service_tiers est ON est.id = eq."serviceTierId"
    LEFT JOIN dbview_schema.enabled_form_version_submissions sform ON sform.id = eq."serviceFormVersionSubmissionId"
    LEFT JOIN dbview_schema.enabled_form_version_submissions tform ON tform.id = eq."tierFormVersionSubmissionId";

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_bookings_ext AS
  SELECT
    eb.id,
    eb."slotDate",
    row_to_json(eqe.*) as quote,
    row_to_json(esbs.*) as "scheduleBracketSlot",
    eb."createdOn",
    eb."createdSub"
  FROM
    dbview_schema.enabled_bookings eb
    LEFT JOIN dbview_schema.enabled_quotes_ext eqe ON eqe.id = eb."quoteId"
    LEFT JOIN dbview_schema.enabled_schedule_bracket_slots esbs ON esbs.id = eb."scheduleBracketSlotId";

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_forms_ext AS
  SELECT
    ef.*,
    egf."formId",
    egf."groupId",
    eefv.* as version
  FROM
    dbview_schema.enabled_group_forms egf
  LEFT JOIN dbview_schema.enabled_forms ef ON ef.id = egf."formId"
  LEFT JOIN LATERAL (
    SELECT
      TO_JSONB(vers) as version
    FROM
    (
      SELECT
        efv.*
      FROM
        dbview_schema.enabled_form_versions efv
      WHERE
        efv."formId" = egf."formId"
      ORDER BY
        efv."createdOn" DESC
      LIMIT
        1
    ) vers
  ) as eefv ON true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_user_schedules_ext AS
  SELECT
    egus.id,
    egus."groupScheduleId",
    egus."userScheduleId",
    eesbe.* as brackets,
    CONCAT(eu."firstName", ' ', LEFT(eu."lastName", 1)) as name
  FROM
    dbview_schema.enabled_group_user_schedules egus
  JOIN dbview_schema.enabled_users eu ON eu.sub = egus."createdSub"
  LEFT JOIN LATERAL (
    SELECT
      JSONB_OBJECT_AGG(sbss.id, TO_JSONB(sbss)) as brackets
    FROM
      (
        SELECT 
          esbe.*
        FROM
          dbview_schema.enabled_schedule_brackets_ext esbe
        WHERE
          esbe."scheduleId" = egus."userScheduleId"
      ) sbss
  ) as eesbe ON true;

EOSQL