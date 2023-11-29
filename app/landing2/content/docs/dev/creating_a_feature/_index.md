---
title: "Creating a Feature"
weight: 6
---

## [&#128279;](#creating-a-feature) Creating a Feature

A feature can mean a lot of different things. Here we'll give a quick rundown of what you might need to do when developing a new feature, from the database to the user interface.

Perhaps the most important aspect of any new implementation is the underlying data structure. We can either first create a Typescript type, or a Postgres table, depending on our needs. Generally, both will be necessary, as the Typescript type will be used to represent the Postgres table.