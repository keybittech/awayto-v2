---
title: "Architecture"
weight: 6
---

## Architecture

Like any full-stack implementation, Awayto has its own concept of the file system and modularization. It would be considered a monorepo by most. However, its interworkings depending on multiple containers working together, whether developing locally or deployed. Beyond this, we have to consider the needs of a production environment versus a development environment. The CLI bridges these concerns by being a unified interface to manage both the development and deployment of the platform.