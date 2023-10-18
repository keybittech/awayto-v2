
# [Awayto Developer Guide](#awayto-developer-guide)

## [Basic Concepts](#basic-concepts)

Awayto is for those seeking a web platform containing many features out of the box which can be further built upon. The core of the project was developed by a single person, with the intention of simplifying development and making constructs to enhance development. Quick feature development is a built-in, as many foundations to fast software development have already been designed and laid.

It is assumed the developer is familiar with common web technologies like APIs and databases, as well as being proficient in Typescript and shell. One key goal of Awayto is to offer a fully featured development environment that can be easily tinkered with and controlled via configuration and scripting. A basic CLI is provided to run commands, from first time setup to deploying, building, and scaling resources locally or in the cloud. 

This guide is intended to expose you to all the custom concepts used in Awayto. It is a system comprised of many technologies, and hopefully you will find the abstractions used to be helpful and assertive. Here we discuss those abstractions, how to use them, and their purpose in the greater scheme of web application development.

## [What is Awayto?](#what-is-awayto)

Awayto is a web application generator built with Typescript. It stands out as a highly-opinionated online multi-modal collaboration platform. Many of the design choices and architecture underlying the system were founded in the construction of an online writing center. However, Awayto is built as generic purpose and allows for the quick and easy development of other communications-related applications.

Developmentally, Awayto is based around some core ideas:

- Enhance the developer experience
- Provide opportunities for developers to learn
- Minimal focus on deployment, managed centrally
- Use conventions that compliment functionality

There is a great deal of functionality threaded throughout the platform created purely to enhance the developer's experience. Most abstractions are planned and designed to be extended. Core systems at both the application layer, like the API, or the development layer, like the CLI, can be added to or modified with very little effort. And with the use of Typescript throughout the application, we are able to utilize a single layer of types, unifying the stack.

Awayto is opinionated software. For the most part an experienced developer will be familiar with the concepts used throughout the system, although some things are homebrew. The theme of this software is "a way to develop" and this "way" is largely governed by the abstractions we use. The closer you follow the information in this guide and code patterns presented, the faster and more effective you will become. Adding new features across the stack is a matter of implementing pre-existing structures that are inherently prevalent within the system. Conventions are used everywhere and anywhere.



## [Create an Awayto Project](#create-an-awayto-project)

### [Installation](#installation)

Clone [the repo](https://github.com/jcmccormick/wc).

```shell
git clone https://github.com/jcmccormick/wc.git && cd wc
```

Set the awayto binary to be executable.

```shell
chmod +x ./awayto
```

Run the first-time developer setup. This will generate the necessary configurations and artifacts to run the stack locally.

```shell
./awayto dev first-run
```

After this process completes, the platform will be running on a number of docker containers spawned locally on your system. If you visit https://localhost in your browser, you should see this page you're reading!

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

## [Features](#features)

In no particular order, here are the first-class softwares used in Awayto, some of their key features, and a primary source for its usage in the system:

| Technology | Description | Source |
|-|-|-|
| Shell | Command-line interface scripting | [/bin]({{< param "repoURL" >}}/tree/main/bin) |
| Typescript | Primary types, api handlers, and components | [/core]({{< param "repoURL" >}}/tree/main/core) |
| Docker | Container service, docker compose, supports cloud deployments | [docker-compose.yaml]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| Kubernetes | Distributed container environment, optional manual deployment path | [/kube]({{< param "repoURL" >}}/tree/main/kube) |
| Postgres | Primary database | [/db]({{< param "repoURL" >}}/tree/main/db) |
| SQLite | File system database | [/fs]({{< param "repoURL" >}}/tree/main/fs) |
| Node.js | Primary runtime environment |-|
| Yarn | Package management | [api package]({{< param "repoURL" >}}/blob/main/api/package.json), [app package]({{< param "repoURL" >}}/blob/main/app/website/package.json) |
| Express.js | API, webhooks | [/api]({{< param "repoURL" >}}/tree/main/api) |
| Bind9 | Nameservers | [ns up]({{< param "repoURL" >}}/blob/main/bin/up/ns) |
| Nginx | Reverse proxy, application server, exit server | [exit server]({{< param "repoURL" >}}/blob/main/deploy/exit.nginx.conf), [reverse proxy]({{< param "repoURL" >}}/tree/main/app/server) |
| ModSecurity | Server security, OWASP coverage | [modsec install]({{< param "repoURL" >}}/blob/main/bin/install/modsec) |
| Fail2Ban | Server security | [exit up]({{< param "repoURL" >}}/blob/main/bin/up/exit) |
| EasyRSA | Internal certificate authority | [builder up]({{< param "repoURL" >}}/blob/main/bin/up/builder) |
| Let's Encrypt | External certificate authority | [ns up]({{< param "repoURL" >}}/blob/main/bin/up/ns) |
| Tailscale | Managed VPN | [deployment up]({{< param "repoURL" >}}/blob/main/bin/up.sh) |
| Hetzner | Cloud deployment variant | [deployment up]({{< param "repoURL" >}}/blob/main/bin/up.sh) |
| AWS | Cloud deployment variant (Future release) |-|
| Keycloak | Authentication and authorization, SSO, SAML, RBAC | [/auth]({{< param "repoURL" >}}/tree/main/auth) |
| Redis | In-memory data store | [redis api module]({{< param "repoURL" >}}/blob/main/api/src/modules/redis.ts) |
| Graylog | Log management and analysis, status dashboards | [graylog api module]({{< param "repoURL" >}}/blob/main/api/src/modules/logger.ts), [content pack]({{< param "repoURL" >}}/blob/main/deploy/graylog-content-pack.json) |
| MongoDB | Logging database | [container only]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| ElasticSearch | Logging database | [container only]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| Hugo | Static site generator for landing, documentation, marketing | [/app/landing]({{< param "repoURL" >}}/tree/main/app/landing) |
| React | Front-end application library, Craco build customized | [/app/website]({{< param "repoURL" >}}/tree/main/app/website) |
| ReduxJS Toolkit | React state management and API service | [redux store]({{< param "repoURL" >}}/blob/main/app/website/src/hooks/store.ts) |
| DayJS | Scheduling and time management library | [time utilities]({{< param "repoURL" >}}/blob/main/app/website/src/hooks/store.ts) |
| Material-UI | React UI framework based on Material Design | [module components]({{< param "repoURL" >}}/tree/main/app/website/src/modules) |
| OpenAI | AI API for suggestions | [custom prompts]({{< param "repoURL" >}}/blob/main/api/src/modules/prompts.ts)
| Coturn | TURN & STUN server for WebRTC based voice and video calling | [/turn]({{< param "repoURL" >}}/tree/main/turn) |
| WebSockets | Dedicated websocket server for messaging orchestration, interactive whiteboard | [/sock]({{< param "repoURL" >}}/tree/main/sock) |

## [Development](#development)

Like any full-stack implementation, Awayto has its own concept of the file system, modularization, and deployments. It exists as a monorepo, but  depends on multiple containers working together to function. This is the case for both local and deployed environments. Beyond this, we have to consider the needs of a production environment versus a development environment. The CLI bridges these concerns by being a unified interface to manage both the development and deployment of the platform.

The root url `/` of the application will serve the built Hugo project. Hugo is used because it is a lightweight static site generator. Ultimately, we want a separation between the JavaScript application we're creating and a landing/marketing page containing other beneficial information. Using Hugo as a first point of entry means the end-user experiences extremely fast response times on their first visit to the site. Later on, when they go to access the application at the `/app` route, and need to download the related JavaScript, such can be done in an incremental fashion; the user isn't innundated with downloading resources on their first visit.
### [Application Architecture](#application-architecture)

For the purposes of core development, services are defined in a central [docker-compose]({{< param "repoURL" >}}/blob/main/docker-compose.yml) file in the root of the project. Here's a brief overview of each and their ports. You can find a root-level folder for each in most cases, containing its own Dockerfile.

|Name|Purpose|Ports|
|-|-|-|
|app|An Nginx host for reverse proxying to other services, and serving Hugo and React files.|80, 443|
|api|Express.js in a node alpine container.|9443|
|db|Postgres in its managed alpine container.|5432|
|redis|Redis in its managed container.|6379|
|fs|A custom file storage implementation, utilizing SQLite and Socat in an alpine container.|8000|
|auth|Keycloak in its managed container.|8080, 8443|
|sock|A custom websocket server in a node alpine container.|8888|
|turn|Coturn in its managed container, using host network to handle port assignments.|3478, 44400-44500 UDP|
|mongo|MongoDB in its managed container.|27017, used by Graylog only.|
|elasticsearch|Elasticsearch in its managed container.|9200, used by Graylog only.|
|graylog|Graylog in its managed container.|9000, 1514 TCP/UDP, 12201 TCP/UDP|
|mail|TBD|TBD|

When starting the stack with `docker compose up -d`, all these ports should be available on the host system. You can review the compose file to see which services depend on others. Not all services are required to be run at the same time. For example, it's often the case we'll stop graylog when developing locally, `docker compose stop graylog mongo elasticsearch`.

With regard to service routing, most services are configured to directly communicate with each other utilizing Docker's networking capabilities. However, to simplify communication with external requests, we use Nginx as a reverse proxy. This way, consumers need only interact with a single host to gain access to platform features.

![Application Reverse Proxy](/doc_images/app_reverse_proxy.png)

## [Deployment](#deployment)

Awayto runs and can be developed on a single system. First and foremost, it is standalone software that can be run on your own system, or configured to be deployed to a network that you control. It is bare-metal first and no cloud usage is required. But we are also interested in operating in a distributed fashion, whether in the cloud or on networks we own. 

Deploying Awayto in the cloud allows us to demonstrate applications of self-hosting and maintaining an internal network. After installing the repo, you can optionally deploy it currently using Tailscale and Hetzner. In the spirit of the software, you are encouraged to review [the deployment scripts]({{< param "repoURL" >}}/blob/main/bin/up.sh) and adjust them to your needs, or throw them out all together.

In a distributed deployment, containers are evaluated and grouped based on their footprint and relation to other services. The following is a high level view of the platform when it is deployed.

![Deployed Architecture](/doc_images/deployed_arch.png)

## Create a Module

- database entries
  - /db/scripts are loaded on first build
  - ./awayto dev db or ./awayto util db can be used to connect to either environment and manually deploy new scripts
- module types
  - creating the type creates an api handler dependency, as well as auto-generating the ReduxJS Toolkit React hooks
- api handler
  - provides all the services via props
  - mandated responses
  - 
- module components