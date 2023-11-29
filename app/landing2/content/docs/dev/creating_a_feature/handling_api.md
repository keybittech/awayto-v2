---
title: "Handling an API"
weight: 4
---

### [&#128279;](#handling-an-api) Handling an API

At this point, we've set up some data structures around our feature, including some endpoints and params we can interact with. To handle the endpoint from the API context, we'll make a new file `/api/src/handlers/todo.ts`. Just like we did with our core type folder definitions, we'll import our new API handler file into `/api/src/handlers/index.ts`. Add this file reference to `createHandlers`, which is a simple utility function to merge all of our endpoint definitions into an object which is bound to the endpoint definitions we're exporting from the core types folder.

In our handler file `todo.ts`, we'll import `createHandlers`, to again make use of that binding, and begin crafting a new object. Intellisense will show us all the available endpoints we can define. It's important to note that all endpoint definitions exported from the `core` package must be accompanied by a corresponding handler, otherwise the `api` package will not compile.

Using the POST method from our Todo example, the definition specifies a "task" as query argument, and we should return an "id". To do this we'll use a simple SQL query using the `pg-promise` client via `props.tx` since this is a `MUTATION`. If we were otherwise writing the handler for a `QUERY`, we would just use `props.db`.

```typescript
import { createHandlers, ITodo } from 'awayto/core';

export default createHandlers({
  postTodo: async props => {
    const { id } = await props.tx.one<ITodo>(`
      INSERT INTO dbtable_schema.todos (task)
      VALUES ($1)
      RETURNING id
    `, [props.event.body.task]);

    return { id };
  },
  // Make sure to define the rest of the handlers below
});
```

That's all there is to API handlers. Now our Express app is exposing the `POST /api/todos` endpoint. Check out the existing handlers in `/api/src/handlers` for examples of what can be done, as well as the [API Props and Functionality](#api-props-and-functionality) guide to learn more about what's available in the `props` object and its features.
