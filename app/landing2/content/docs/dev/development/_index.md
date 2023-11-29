---
title: "Development"
weight: 7
---

## [&#128279;](#development) Development

Like any full-stack implementation, Awayto has its own concept of the file system, modularization, and deployments. It is built as a monorepo, but its function depends on multiple containers working together. This is the case for both local and deployed environments. Beyond this, we have to consider the needs of a production environment versus a development environment. The CLI bridges these concerns by being a unified interface to manage both the development and deployment of the platform.

The root url `/` of the application will serve the built Hugo project. Hugo is used because it is a lightweight static site generator. Ultimately, we want a separation between the javascript application we're creating and a landing/marketing page containing other beneficial information. Using Hugo as a first point of entry means the end-user experiences extremely fast response times on their first visit to the site. Later on, when they go to access the application at the `/app` route, and need to download the related javascript, such can be done in an incremental fashion; the user isn't innundated with downloading resources on their first visit.