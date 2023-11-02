---
title: "Handling an API"
weight: 4
---

### [Handling an API](#handling-an-api)

At this point, we've set up some data structures around our feature, including some endpoints and params we can interact with. To handle the endpoint from the API context, we'll make a new file `/api/src/handlers/todo.ts`. Similarly to our core type definitions, we'll import our new handler file into `/handlers/index.ts`, and add its reference to `createHandlers`, which is a simple utility function to merge our endpoint definitions into an object bound by our core type definitions.

In our handler file `todo.ts`, we'll import `createHandlers`, and begin crafting a new object. As this object is bound by our API types, we can begin typing the name of an endpoint (like `postTodo`) and make use of tab auto-completion to insert our handler. Using the example of POSTing a Todo record, the endpoint specifies a "task" as query param, and we should return an "id". To do this we'll use a simple SQL query using the `pg-promise` client.

```typescript
import { createHandlers, ITodo } from 'awayto/core';

export default createHandlers({
  postTodo: async props => {
    const { task } = props.event.body;

    const { id } = await props.db.one<ITodo>(`
      INSERT INTO dbtable_schema.todos (task)
      VALUES ($1)
      RETURNING id
    `, [task]);

    return { id };
  }
});
```

That's all there is to API handlers. Now our Express app is exposing the `POST /api/todos` endpoint. Check out the [API Props]() guide to learn more about what's available in the `props` object.