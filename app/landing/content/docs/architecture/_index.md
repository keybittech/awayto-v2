---
title: "Architecture"
weight: 6
---

## [Architecture](#architecture)

Like any full-stack implementation, Awayto has its own concept of the file system, modularization, and deployments. It is built as a monorepo, but its function depends on multiple containers working together. This is the case for both local and deployed environments. Beyond this, we have to consider the needs of a production environment versus a development environment. The CLI bridges these concerns by being a unified interface to manage both the development and deployment of the platform.

Awayto runs and can be developed on a single system. But we are also interested in operating in a distributed fashion, whether in the cloud or on networks we own. Deploying Awayto in the cloud allows us to demonstrate applications of self-hosting and maintaining an internal network. The current installation comes with a cloud deployment path requiring Tailscale and Hetzner. (But just to re-iterate, this is a standalone piece of software that you can run on your own system, or configure to be deployed to a network that you control. It is bare-metal first and no cloud usage is required.)

To structure our analysis of architecture, we'll review the **Application** as related to its development, and then the **Network** as related to its deployment.