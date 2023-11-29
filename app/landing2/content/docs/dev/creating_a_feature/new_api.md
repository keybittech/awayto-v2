---
title: "Defining API Endpoints"
weight: 3
---

### [&#128279;](#defining-api-endpoints) Defining API Endpoints

Endpoint definitions are one of the most powerful abstractions available, due to their expressivity, simplicity, and far-reaching effects. After hooking up our definition, we get to benefit from automated server-side request validation, auto-generated React hooks, and support for an API handler that we can customize. 

In order to define an endpoint, we can expand the same core type file we created for our type, `/core/src/types/todo.ts`. You can of course create stand-alone APIs that aren't related to a type; just follow the conventions here in a new file in the core types folder.

- The default export of a `/core/src/types` file is treated as an object of endpoint definitions. You can see how the exports are used and merged in the [core type index]({{< param "repoURL" >}}/tree/main/core/src/types/index.ts).
- All top-level definition attributes (`kind`, `url`, `method`, etc.) must be defined. Endpoint definitions use Typescript's `as const` statement, therefore all definitions must be alike in structure. `as const` lets us use our object at runtime, while establishing narrow types for our overall usage with Typescript related features. In other words, if we had only defined the following `export default` construct as a Typescript type, we wouldn't get to use any of its details at runtime. Instead, creating an object that uses `as const` is more or less the best of both worlds for our needs. 

```typescript
import { ApiOptions, EndpointType } from './api';
import { Void } from '../util';

// Typescript type resides here, then we export the API definition...

export default {
  postTodo: {
    kind: EndpointType.MUTATION,
    url: 'todos',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { task: '' as string },
    resultType: { id: '' as string }
  },
  putTodo: {
    kind: EndpointType.MUTATION,
    url: 'todos',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { done: true as boolean },
    resultType: { success: true as boolean }
  },
  getTodos: {
    kind: EndpointType.QUERY,
    url: 'todos',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as ITodo[]
  },
  getTodoById: {
    kind: EndpointType.QUERY,
    url: 'todos/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as ITodo
  },
  deleteTodo: {
    kind: EndpointType.MUTATION,
    url: 'todos/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { success: true as boolean }
  }
} as const;
```

- `kind`: MUTATION or QUERY. In practice QUERY is used for all GET requests. MUTATION is used for everything else. When we use MUTATION, our usage of the database inside API handlers is automatically wrapped in a transaction.
- `url`: URLs are supported with common path and query param usage; these properties must be provided in the queryArgs object and passed on calling the endpoint. For example, `todos/:id` would expect us to have `id` listed in `queryArgs`. Alternatively we could write `todos?id=:id`, depending on your needs. In the API handler, these properties are available with `props.event.pathParameters` or `props.event.queryParameters`, respectively.
- `method`: GET, PUT, POST, DELETE
- `opts`: Optional configurations. Listed [here](#api-options).
- `queryArg`: A combination of path, query, and request body parameters. This determines what we require to make a request from the front-end, and what is available to us in the API's handler.
- `resultType`: The API handler must return something matching this type, or throw an error.
- A negative side-effect of using `as const` requires us to define types for each property in `queryArg` and `resultType` (i.e. `id: '' as string`). This is so our IDE can handle both generic and narrow typing of the endpoint definitions; this is important when we go to build and use hooks and API handlers.
- Defining `{} as Void` for `queryArg` or `resultType` will supply API handlers and React hooks with the correct types when no parameters are necessary.

#### Extend the Type exports

Once you've created your API definition, you need to hook it in to the merged API definitions. You can find the merged definitions in `/core/src/types/index.ts`.

- Import your new type file
- Add its reference to `siteApiRef`
- Export the reference from the index