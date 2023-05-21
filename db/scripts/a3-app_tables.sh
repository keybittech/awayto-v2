#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb

  CREATE TABLE dbtable_schema.budgets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  INSERT INTO
    dbtable_schema.budgets (name)
  VALUES
    ('\$500 - \$1,000'),
    ('\$1,000 - \$10,000'),
    ('\$10,000 - \$100,000');

  CREATE TABLE dbtable_schema.timelines (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  INSERT INTO
    dbtable_schema.timelines (name)
  VALUES
    ('1 month'),
    ('6 months'),
    ('1 year');

  CREATE TABLE dbtable_schema.forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.group_forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL REFERENCES dbtable_schema.groups (id),
    form_id uuid NOT NULL REFERENCES dbtable_schema.forms (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (group_id, form_id)
  );

  CREATE TABLE dbtable_schema.form_versions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL REFERENCES dbtable_schema.forms (id),
    form JSONB NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.form_version_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_version_id uuid NOT NULL REFERENCES dbtable_schema.form_versions (id),
    submission JSONB NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL,
    cost VARCHAR(50) NOT NULL,
    form_id uuid REFERENCES dbtable_schema.forms (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (name, created_sub)
  );

  CREATE TABLE dbtable_schema.group_services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL REFERENCES dbtable_schema.groups (id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES dbtable_schema.services (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (group_id, service_id)
  );

  CREATE TABLE dbtable_schema.service_addons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_service_addons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    service_addon_id uuid NOT NULL REFERENCES dbtable_schema.service_addons (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, service_addon_id)
  );

  CREATE TABLE dbtable_schema.service_tiers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL REFERENCES dbtable_schema.services (id) ON DELETE CASCADE,
    form_id uuid REFERENCES dbtable_schema.forms (id),
    name VARCHAR (500) NOT NULL,
    multiplier DECIMAL NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (name, service_id)
  );

  CREATE TABLE dbtable_schema.service_tier_addons (
    service_tier_id uuid NOT NULL REFERENCES dbtable_schema.service_tiers (id) ON DELETE CASCADE,
    service_addon_id uuid NOT NULL REFERENCES dbtable_schema.service_addons (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (service_tier_id, service_addon_id)
  );

  CREATE TABLE dbtable_schema.contacts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (250),
    email VARCHAR (250),
    phone VARCHAR (20),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.time_units (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  INSERT INTO
    dbtable_schema.time_units (name)
  VALUES
    ('minute'),
    ('hour'),
    ('day'),
    ('week'),
    ('month'),
    ('year');

  CREATE TABLE dbtable_schema.schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50),
    start_time DATE,
    end_time DATE,
    timezone VARCHAR(128),
    schedule_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    bracket_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    slot_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    slot_duration INTEGER NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.group_schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL REFERENCES dbtable_schema.groups (id) ON DELETE CASCADE,
    schedule_id uuid NOT NULL REFERENCES dbtable_schema.schedules (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (group_id, schedule_id)
  );

  CREATE TABLE dbtable_schema.group_user_schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_schedule_id uuid NOT NULL REFERENCES dbtable_schema.schedules (id) ON DELETE CASCADE,
    user_schedule_id uuid NOT NULL REFERENCES dbtable_schema.schedules (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (group_schedule_id, user_schedule_id)
  );

  CREATE TABLE dbtable_schema.schedule_brackets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id uuid NOT NULL REFERENCES dbtable_schema.schedules (id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    multiplier DECIMAL NOT NULL,
    automatic BOOLEAN NOT NULL DEFAULT false,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.schedule_bracket_slots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_bracket_id uuid NOT NULL REFERENCES dbtable_schema.schedule_brackets (id) ON DELETE CASCADE,
    start_time INTERVAL NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (schedule_bracket_id, start_time)
  );

  CREATE TABLE dbtable_schema.schedule_bracket_services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_bracket_id uuid NOT NULL REFERENCES dbtable_schema.schedule_brackets (id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES dbtable_schema.services (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (schedule_bracket_id, service_id)
  );

  CREATE TABLE dbtable_schema.quotes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_date DATE NOT NULL,
    schedule_bracket_slot_id uuid NOT NULL REFERENCES dbtable_schema.schedule_bracket_slots (id),
    service_tier_id uuid NOT NULL REFERENCES dbtable_schema.service_tiers (id),
    service_form_version_submission_id uuid REFERENCES dbtable_schema.form_version_submissions (id),
    tier_form_version_submission_id uuid REFERENCES dbtable_schema.form_version_submissions (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.quote_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id uuid NOT NULL REFERENCES dbtable_schema.quotes (id) ON DELETE CASCADE,
    file_id uuid NOT NULL REFERENCES dbtable_schema.files (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id uuid NOT NULL REFERENCES dbtable_schema.quotes (id),
    slot_date DATE NOT NULL,
    schedule_bracket_slot_id uuid NOT NULL REFERENCES dbtable_schema.schedule_bracket_slots (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.sock_connections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id TEXT NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.topic_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    message JSONB NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE INDEX topic_index ON dbtable_schema.topic_messages (topic);

  CREATE TABLE dbtable_schema.exchange_call_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid NOT NULL REFERENCES dbtable_schema.bookings (id),
    style TEXT NOT NULL,
    connected TIMESTAMP NOT NULL,
    disconnected TIMESTAMP,
    transcript JSONB, -- this denotes audio based chat logs
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.schedule_bracket_slot_exclusions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    exclusion_date DATE NOT NULL,
    schedule_bracket_slot_id uuid REFERENCES dbtable_schema.schedule_bracket_slots (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id uuid NOT NULL REFERENCES dbtable_schema.contacts (id) ON DELETE CASCADE,
    details jsonb NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.group_feedback (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL REFERENCES dbtable_schema.groups (id),
    message TEXT,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

EOSQL