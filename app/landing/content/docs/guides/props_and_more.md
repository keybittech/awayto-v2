---
title: "Props and More"
weight: 2
---

### [Props and More](#props-and-more)

An API handler is an asynchronous function taking a single parameter, `props`, which provides access to functionality and user resources. For the most part, we can get by with everything we'll find in props. But, as we'll see, there are other tools in our bag we can reach for when interacting with the API.

To begin with, all requests contain an `event`. The event type is a generic which expects `typeof queryArg` from an endpoint definition. The following describes all of the pieces of data available in the `event`:

```typescript
export type ApiEvent<T extends AnyRecord | AnyRecordTypes> = {
  requestId: string;
  method: string;
  url: string;
  public: boolean;
  userSub: string;
  sourceIp: string;
  group: Partial<IGroup>;
  groups?: string[];
  availableUserGroupRoles: UserGroupRoles;
  pathParameters: Record<string, string>;
  queryParameters: Record<string, string>;
  body: T;
}
```

- `requestId`: Every request is given a unique id.
- `method`: The method of the request.
- `url`: The matching endpoint definition URL.
- `public`: _deprecated_ Internal public flag.
- `userSub`: The user's subject claim as determined by Keycloak.
- `sourceIp`: An anonymized version of the user's ip address.
- `group`: The user session's current group.
- `groups`: A reference to the user's groups.
- `availableUserGroupRoles`: Listing of user's roles within each group, and the action-groups available to them.
- `pathParameters`: An object of any path paramters as denoted by endpoint URL definitions.
- `queryParameters`: An object of any query parameters as denoted by endpoint URL definitions.
- `body`: The body of the request, which assumes the shape of the `queryArg` parameter of an endpoint definition.

Now that we understand the metadata we can work with in every request, using the `props.event` accessor, let's look at the functionality available to each request. 


```typescript
export type ApiProps<T extends AnyRecord | AnyRecordTypes> = {
  event: ApiEvent<T>;
  db: IDatabase<unknown>;
  fetch: typeof fetch;
  logger: graylog;
  redis: RedisClientType;
  redisProxy: RedisProxy;
  keycloak: KeycloakAdminClient & KcSiteOpts;
  fs: FsFunctionalities;
  ai: AiFunctionalities;
  tx: ITask<unknown>;
}
```

- `event`: Described above.
- `db`: A `pg-promise` based database client.
- `fetch`: NodeJS `fetch` library.
- `logger`: A simple logging utility for sending messages to our Graylog instance.
- `redis`: NodeJS `redis` library.
- `redisProxy`: A server-local `redis` cache for commonly used server configurations.
- `keycloak`: NodeJS `keycloak-admin-client` library.
- `fs`: A set of functions to store, expire, and get files from the file storage instance.
- `ai`: Application wrapper around the `wizapp` package.
- `tx`: When in a MUTATION-based handler, this is the available database transaction.