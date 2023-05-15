#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  \c sysmaindb
  
  DROP SCHEMA IF EXISTS dbview_schema CASCADE;
  CREATE SCHEMA dbview_schema;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_users AS
  SELECT
    u.id,
    u.first_name as "firstName",
    u.last_name as "lastName",
    u.username,
    u.sub,
    u.image,
    u.email,
    u.locked,
    u.created_on as "createdOn",
    u.updated_on as "updatedOn",
    u.enabled,
    row_number() OVER () as row
  FROM
    dbtable_schema.users u
  WHERE
    u.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_roles AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.roles
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_user_roles AS
  SELECT
    id,
    role_id as "roleId",
    user_id as "userId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.user_roles
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_groups AS
  SELECT
    id,
    name,
    display_name as "displayName",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.groups
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_users AS
  SELECT
    id,
    user_id as "userId",
    group_id as "groupId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_users
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_roles AS
  SELECT
    id,
    role_id as "roleId",
    group_id as "groupId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_roles
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_file_types AS
  SELECT
    id,
    name,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.file_types
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_files AS
  SELECT
    f.id,
    f.uuid,
    f.name,
    f.mime_type as "mimeType",
    f.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.files f
  WHERE
    f.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_group_files AS
  SELECT
    gf.id,
    gf.file_id as "fileId",
    f.name,
    gf.group_id as "groupId",
    gf.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.group_files gf
    JOIN dbview_schema.enabled_files f ON f.id = gf.file_id
  WHERE
    gf.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_notes AS
  SELECT
    un.id,
    un.parent_uuid as "parentUuid",
    un.note,
    un.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_notes un
  WHERE
    un.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_groups_ext AS
  SELECT
    eg.*,
    g.purpose,
    g.code,
    g.default_role_id as "defaultRoleId",
    g.allowed_domains as "allowedDomains",
    ug."usersCount",
    rls.* as roles
  FROM
    dbview_schema.enabled_groups eg
    JOIN dbtable_schema.groups g ON g.id = eg.id
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(r.id, TO_JSONB(r)) as roles
      FROM
        (
          SELECT
            er.id,
            er.name
          FROM
            dbview_schema.enabled_group_roles egr
            JOIN dbview_schema.enabled_roles er ON egr."roleId" = er.id
          WHERE
            egr."groupId" = eg.id
        ) r
    ) as rls ON true
    LEFT JOIN (
      SELECT
        egu."groupId",
        COUNT(egu."userId") as "usersCount"
      FROM
        dbview_schema.enabled_group_users egu
        JOIN dbview_schema.enabled_users u ON u.id = egu."userId"
      GROUP BY
        egu."groupId"
    ) ug ON ug."groupId" = eg.id;

EOSQL