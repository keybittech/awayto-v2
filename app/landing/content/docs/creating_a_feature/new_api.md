---
title: "Defining an API"
weight: 3
---

### [Defining an API](#defining-an-api)

API definitions are one of the most powerful abstractions available, due to their expressivity, simplicity, and far-reaching effects. By defining strict conventions here we can provide a great deal of functionality throughout the platform. 

In order to create an API we can expand the same core type file we created for our type, `/core/src/types/todo.ts`. You can of course create stand-alone APIs; they don't need to be associated with an existing Typescript type; add a new file to the types folder and follow the conventions described here:

- The default export of a `/core/src/types` file is treated as an object of API definitions. You can see how the exports are used in the [core type index]({{< param "repoURL" >}}/tree/main/core/src/types/index.ts).
- All top-level definition attributes (`kind`, `url`, `method`, etc.) must be defined. Definitions are bound by Typescript's `as const` statement, which requires all objects be of the same structure when being merged. `as const` ensures that the properties required for operation will be available.

```typescript
import { ApiOptions, EndpointType } from './api';
import { Void } from '../util';

// Typescript type resides here, then we export the API...

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
- `url`: The URL can contain variables, preceeded by `:`, which will be extracted from `queryArgs`. For example, `id` in the URL `todos/:id` requires that we define an `id` property in our `queryArgs`.
- `method`: GET, PUT, POST, DELETE
- `opts`: Optional configurations. Listed [here](#optional-configurations).
- `queryArg`: A combination of URL parameters and request body. This determines what we require to make a request from the front-end, and what is available to us in the API's handler. A negative side-effect of using `as const` requires us to define types for each property in `queryArg` and `resultType` (i.e. `id: '' as string`). This is so that when API definitions are merged, generic type usage is preserved in various cases with IDE type checking.
- `resultType`: The API handler must return something matching this type, or throw an error.
- Defining `{} as Void` for `queryArg` or `resultType` will supply API handlers and React hooks with the correct types when no parameters are necessary.