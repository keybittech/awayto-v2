---
title: "Run the Project"
weight: 2
---

### [Run the Project](#run-the-project)

Awayto primarily runs its processes in Docker containers. Upon installation, these containers are built and started for you. In normal development, you may need to stop and start the stack or various parts of it.

```shell
# Stop
docker compose down

# Start
docker compose up -d --build
```

Review the `docker-compose.yaml` file in the main directory to see what services are started. To rebuild a single service, simply append the service name.

```shell
# Rebuild
docker compose up -d --build app
```