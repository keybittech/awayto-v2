---
title: "Creating a Feature"
weight: 2
---

### [Creating a Feature](#creating-a-feature)

A feature can mean a lot of different things. Here we'll give a quick rundown of what you might need to do when developing a new feature. We'll try to cover all aspects of what might be needed, from the database to the user interface.

Perhaps the most important aspect of any new implementation is the underlying data structure. We can either first create a Typescript type, or a Postgres table, depending on our needs. Generally, both will be necessary, as the Typescript type will be used to represent the Postgres table.

#### [A Table with a View](#a-table-with-a-view)

All database scripts for the platform are stored in the `/db/scripts` folder. They will be run the first time the db container runs while using an empty volume. For example, when you run the first time developer installation, a docker volume is created and, since it is empty, the Postgres docker installation will automatically run our database scripts for us. The scripts are named alphanumerically and will be run in that order.

New database scripts can be deployed in various ways. After running the installation, you will have a Postgres container running on your system. You can log into the running Postgres instance by using the `dev db` CLI command.

```shell
./awayto dev db

# run SQL scripts
CREATE TABLE ...
```

Or we could do it the old fashioned way.

```shell
docker exec -it $(docker ps -aqf "name=db") /bin/sh

# connected to the container
su - postgres
psql

# connected to Postgres
\c pgdblocal -- this is the default dev db name

# run SQL scripts
CREATE TABLE ...
```

To connect to a deployed db, use the `util db` CLI command.

```shell
./awayto util db
# enter the name of your deployment

# run SQL scripts
CREATE TABLE ...
```

If you take a look at the `/db/scripts` files and review how existing tables are deployed, auditing columns are included most everywhere. As an example, we'll setup a basic todo feature in our app. We'll make a new file in the scripts folder, `/db/scripts/c1-custom_tables.sh`. It's a shell file as this is one way to perform the auto deployment when the Postgres container starts up for the first time. We'll put the following in our file, as well as run the SQL statement as shown in one of the methods above.

```bash
#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  CREATE TABLE dbtable_schema.todos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,

    -- Auditing Columns:
    created_on TIMESTAMP NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_sub uuid REFERENCES dbtable_schema.users (sub),
    updated_on TIMESTAMP,
    updated_sub uuid REFERENCES dbtable_schema.users (sub),
    enabled BOOLEAN NOT NULL DEFAULT true
  );

EOSQL
```

You'll notice we nest our tables in the schema `dbtable_schema`. There is also `dbview_schema` and to this we will add a simple view to wrap our usage. Views are the primary way data will be queried when we get to creating our API functionality. We'll create another new file `/db/scripts/c1-custom_views.sh` with our view. Remember to also run the SQL script in the db container as described previously.

```bash
#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'

  CREATE
  OR REPLACE VIEW dbview_schema.enabled_todos AS
  SELECT
    id,
    task,
    done,
    created_on as "createdOn",
    row_number() OVER () as row
  FROM
    dbtable_schema.todos
  WHERE
    enabled = true;

EOSQL
```

A few important callouts about view structures and project conventions:

- Generally views represent active or enabled records, so we name the view as such, `enabled_todos`. In some situation where we need to hide a record from the set for some reason (soft-delete, data retention, etc.), we can make use of the enabled flag.
- Views are the primary transition layer between the database schema and the application layer. Database naming conventions follow snake-case naming, while the application uses camel-case. This conversion occurs in the view where applicable.
- A row number can be added for ordering within the set where needed.

