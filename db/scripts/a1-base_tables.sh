#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb

  DROP SCHEMA IF EXISTS dbtable_schema CASCADE;
  CREATE SCHEMA dbtable_schema;

  GRANT ALL ON SCHEMA dbtable_schema TO postgres;

  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE dbtable_schema.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR (255) NOT NULL UNIQUE,
    sub uuid NOT NULL UNIQUE,
    image VARCHAR (250),
    first_name VARCHAR (255),
    last_name VARCHAR (255),
    email VARCHAR (255),
    ip_address VARCHAR (40),
    locked BOOLEAN NOT NULL DEFAULT false,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE INDEX user_sub_index ON dbtable_schema.users (sub);

  CREATE TABLE dbtable_schema.roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    role_id uuid NOT NULL REFERENCES dbtable_schema.roles (id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, role_id)
  );

  CREATE TABLE dbtable_schema.groups (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) NOT NULL UNIQUE,
    role_id uuid NOT NULL REFERENCES dbtable_schema.roles (id) ON DELETE CASCADE,
    name VARCHAR (50) NOT NULL UNIQUE,
    code TEXT NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_groups (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid uuid NOT NULL,
    group_id uuid NOT NULL REFERENCES dbtable_schema.groups (id) ON DELETE CASCADE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, group_id)
  );

  CREATE TABLE dbtable_schema.file_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR (50) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  INSERT INTO
    dbtable_schema.file_types (name)
  VALUES
    ('images'),
    ('documents');

  CREATE TABLE dbtable_schema.files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR (50) NOT NULL,
    name VARCHAR (50),
    file_type_id uuid NOT NULL REFERENCES dbtable_schema.file_types (id),
    location VARCHAR (250),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

  CREATE TABLE dbtable_schema.uuid_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid VARCHAR (50) NOT NULL,
    file_id uuid NOT NULL REFERENCES dbtable_schema.files (id),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, file_id)
  );

  CREATE TABLE dbtable_schema.uuid_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_uuid VARCHAR (50) NOT NULL,
    note VARCHAR (500),
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (parent_uuid, note, created_sub)
  );

  CREATE TABLE dbtable_schema.request_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub VARCHAR (50) NOT NULL,
    path VARCHAR (500),
    direction VARCHAR (10),
    code VARCHAR (5),
    payload VARCHAR (5000),
    ip_address VARCHAR (50) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid NOT NULL REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

EOSQL