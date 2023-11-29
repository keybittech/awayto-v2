---
title: "Deployment"
weight: 8
---

## [&#128279;](#deployment) Deployment


Awayto runs and can be developed on a single system. First and foremost, it is standalone piece of software that can be run on your own system, or configured to be deployed to a network that you control. It is bare-metal first and no cloud usage is required. But we are also interested in operating in a distributed fashion, whether in the cloud or on networks we own. 

Deploying Awayto in the cloud allows us to demonstrate applications of self-hosting and maintaining an internal network. After installing the repo, you can optionally deploy it so far using Tailscale and Hetzner. In the spirit of the software, you are encouraged to review [the deployment scripts]({{< param "repoURL" >}}/blob/main/bin/up.sh) and adjust them to your needs, or throw them out all together.

In a distributed deployment, containers are evaluated and grouped based on their footprint and relation to other services. The following is a high level view of the platform when it is deployed.

![Deployed Architecture](/doc_images/deployed_arch.png)