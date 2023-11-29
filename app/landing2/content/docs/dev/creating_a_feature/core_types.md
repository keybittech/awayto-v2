---
title: "Core Types"
weight: 2
---

### [&#128279;](#core-types) Core Types

Whether represting data structures from a custom process, external API, or database table, we use Typescript to define the type of data usable throughout the application layer. Types are primarily used in the API or UI. To make our types available to the stack, we can define it in the `/core/src/types` folder.

Using our Todo example, we create a new file in the core types folder to support our Todo feature, `/core/src/types/todo.ts`. Files are named using the singular variant of objects, as are most of an object's constructs. One exception is endpoint URLs, which use plural form, `todos`.

```typescript
export type ITodo = {
  id: string;
  task: string;
  done: boolean;
  createdAt: string;
  row: number;
}
```

As expected, we define a structure matching the output of the view we created earlier. Prefixing our object name with I isn't quite Hungarian notation in this case. Instead, it's just a quick way to denote that the type is _Internal_, i.e. we made it as application developers; its name likely won't ever conflict with third-party libraries. With this definition in place, we can now utilize this type in the API or React app. Next we'll expand this same file with our desired API endpoint definitions.

Note: Any time you add a new file or update to the core package, it's generally a good idea to fully restart any running dev servers when developing the API or UI.