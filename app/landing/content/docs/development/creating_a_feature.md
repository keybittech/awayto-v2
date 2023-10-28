---
title: "Creating a Feature"
weight: 2
---

### [Creating a Feature](#creating-a-feature)

A feature can mean a lot of different things. Here we'll give a quick rundown of what you might need to do when developing a new feature. We'll try to cover all aspects of what might be needed, from the database to the user interface.

#### [Data Structures](#data-structures)

Perhaps the most important aspect of any new implementation is the underlying data structure. We can either first create a Typescript type, or a Postgres table, depending on our needs. Generally, both will be necessary, as the Typescript type will be used to represent the Postgres table.

##### Creating a Table

All database scripts for the platform are stored in the `/db/scripts` folder. They will be run the first time the db container runs while using an empty volume. For example, when you run the first time developer installation, a docker volume is created, and since it is empty, the Postgres docker installation will automatically run our database scripts for us. The scripts are named alphanumerically and will be run in that order.

New database scripts can be deployed in various ways. After running the installation, you will have a Postgres container running on your system. You can log into the running Postgres instance with the following commands.

```
docker exec -it $(docker ps -aqf "name=db") /bin/sh
...
su - postgres
psql
...
\c pgdblocal
# run your scripts
```

Alternatively, we can use the CLI to get to our dev db.

```
./awayto dev db
# run your scripts
```

Further, to connect to a deployed db, you can use a different CLI command.

```
./awayto util db
# enter the name of your deployment
# run your scripts
```