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
  OR REPLACE VIEW dbview_schema.enabled_groups AS
  SELECT
    id,
    external_id as "externalId",
    role_id as "roleId",
    name,
    purpose,
    code,
    created_on as "createdOn",
    created_sub as "createdSub",
    row_number() OVER () as row
  FROM
    dbtable_schema.groups
  WHERE
    enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_groups AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    group_id as "groupId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_groups
  WHERE
    enabled = true;

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
  OR REPLACE VIEW dbview_schema.enabled_uuid_roles AS
  SELECT
    id,
    parent_uuid as "parentUuid",
    role_id as "roleId",
    external_id as "externalId",
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_roles
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
    f.file_type_id as "fileTypeId",
    ft.name as "fileTypeName",
    f.location,
    f.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.files f
    JOIN dbtable_schema.file_types ft ON f.file_type_id = ft.id
  WHERE
    f.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_files AS
  SELECT
    uf.id,
    uf.parent_uuid as "parentUuid",
    uf.file_id as "fileId",
    uf.created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.uuid_files uf
  WHERE
    uf.enabled = true;

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_uuid_notes AS
  SELECT
    un.id,
    un.parent_uuid as "parentUuid",
    un.note,
    un.created_sub as "createdSub",
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
    ug."usersCount",
    rls.* as roles
  FROM
    dbview_schema.enabled_groups eg
    LEFT JOIN LATERAL (
      SELECT
        JSONB_OBJECT_AGG(r.id, TO_JSONB(r)) as roles
      FROM
        (
          SELECT
            er.id,
            er.name
          FROM
            dbview_schema.enabled_uuid_roles eur
            JOIN dbview_schema.enabled_roles er ON eur."roleId" = er.id
          WHERE
            eur."parentUuid" = eg.id
        ) r
    ) as rls ON true
    LEFT JOIN (
      SELECT
        eug."groupId",
        COUNT(eug."parentUuid") as "usersCount"
      FROM
        dbview_schema.enabled_uuid_groups eug
        JOIN dbview_schema.enabled_users u ON u.id = eug."parentUuid"
      GROUP BY
        eug."groupId"
    ) ug ON ug."groupId" = eg.id;

EOSQL