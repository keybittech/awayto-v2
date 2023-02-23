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

  CREATE TABLE dbtable_schema.services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL,
    cost VARCHAR(50) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (name, created_sub)
  );

  CREATE TABLE dbtable_schema.uuid_services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    service_id uuid NOT NULL REFERENCES dbtable_schema.services (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, service_id)
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
    name VARCHAR (500) NOT NULL,
    service_id uuid NOT NULL REFERENCES dbtable_schema.services (id) ON DELETE CASCADE,
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
    duration INTEGER NOT NULL,
    schedule_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    bracket_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    slot_time_unit_id uuid NOT NULL REFERENCES dbtable_schema.time_units (id) ON DELETE CASCADE,
    slot_duration INTEGER NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (name, created_sub)
  );

  CREATE TABLE dbtable_schema.uuid_schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    schedule_id uuid NOT NULL REFERENCES dbtable_schema.schedules (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, schedule_id)
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
    start_time TIMESTAMP NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (schedule_bracket_id, start_time)
  );

  CREATE TABLE dbtable_schema.schedule_bracket_services (
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
    name VARCHAR (250) NOT NULL,
    description VARCHAR (5000) NOT NULL,
    budget_id uuid NOT NULL REFERENCES dbtable_schema.budgets (id) ON DELETE CASCADE,
    timeline_id uuid NOT NULL REFERENCES dbtable_schema.timelines (id) ON DELETE CASCADE,
    service_tier_id uuid NOT NULL REFERENCES dbtable_schema.service_tiers (id) ON DELETE CASCADE,
    desired_duration INTEGER NOT NULL,
    contact_id uuid NOT NULL REFERENCES dbtable_schema.contacts (id) ON DELETE CASCADE,
    respond_by TIMESTAMP NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_quotes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    quote_id uuid NOT NULL REFERENCES dbtable_schema.quotes (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, quote_id)
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

  CREATE TABLE dbtable_schema.uuid_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    payment_id uuid NOT NULL REFERENCES dbtable_schema.payments (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, payment_id)
  );

  CREATE TABLE dbtable_schema.bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_tier_id uuid NOT NULL REFERENCES dbtable_schema.service_tiers (id) ON DELETE CASCADE,
    contact_id uuid NOT NULL REFERENCES dbtable_schema.contacts (id) ON DELETE CASCADE,
    payment_id uuid NOT NULL REFERENCES dbtable_schema.payments (id) ON DELETE CASCADE,
    agreement BOOLEAN NOT NULL,
    description VARCHAR (5000) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    booking_id uuid NOT NULL REFERENCES dbtable_schema.bookings (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, booking_id)
  );

  CREATE TABLE dbtable_schema.booking_schedule_brackets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid NOT NULL REFERENCES dbtable_schema.bookings (id) ON DELETE CASCADE,
    schedule_bracket_id uuid NOT NULL REFERENCES dbtable_schema.schedule_brackets (id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (booking_id, schedule_bracket_id)
  );

EOSQL