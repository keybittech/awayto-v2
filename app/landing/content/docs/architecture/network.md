---
title: "Network Architecture"
weight: 2
---

### [Network Architecture](#network-architecture)

The networking stack in Awayto needs to account for external and internal services, as well as production versus development environments. Docker containers are used as the basis for running operations.

In development, we use docker networking to establish connectivity between containers, and rely on this in order to configure properties files within the system. In a distributed deployment, containers are evaluated and grouped based on their footprint and relation to other services. 