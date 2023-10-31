---
title: "Core Types"
weight: 2
---

### [Core Types](#core-types)

Whether represting data structures from a custom process, external API, or database table, we use Typescript to define the type of data usable throughout the application layer. Types are primarily used in the API or UI. To make our types available to the stack, we can define it in the `/core/src/types` folder.

Using our example, we create a new file in the core folder to support our usage of Todos, `/core/src/types/todo.ts`:

```typescript
export type ITodo = {
  id: string;
  task: string;
  done: boolean;
  createdAt: string;
  row: number;
}
```

As expected, we define a structure matching the output of the view we created earlier. The type name is preceeded with an I to denote that it is an Internal type to the system. This is all that's required to utilize this type in other parts of the system. Next we'll expand this same file with our desired API usage.

Note: Any time you add a new file or update to the core package, it's generally a good idea to fully restart any running dev servers when developing the API or UI.