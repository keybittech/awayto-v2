---
title: "Creating a Component"
weight: 5
---

### [Creating a Component](#creating-a-component)

All of the front-end elements of the platform reside in the `/app` folder. Within, you will find three important folders as well as the `Dockerfile` which builds the `app` service. 

- `/landing` is a Hugo application, the contents of which you are reading right now!
- `/server` contains Nginx configurations for local or deployed environments.
- `/website` is a React application, built with customized Craco configuration.

For this exercise we will just focus on the `/app/website` folder, in order to make a front-end component which can utilize our Todos API. Begin by creating a new file in `/app/website/src/modules/example/Todos.tsx`. The UI is implemented primarily using React functional components.  Here we'll provide a sample component using basic React constructs with Material-UI, then describe the important aspects:

```typescript
import React, { useState } from 'react';
import TextField from '@mui/material/TextField';

import { sh, useUtil } from 'awayto/hooks';

export function Todos (): React.JSX.Element {

  const { setSnack } = useUtil();
  const [postTodo] = sh.usePostTodoMutation();

  const [todo, setTodo] = useState({
    task: ''
  });
  
  const handleSubmit = () => {
    const { task } = todo;

    if (!task) {
      setSnack({ snackType: 'error', snackOn: 'You must have something todo!' });
      return;
    }
    
    postTodo({ task });
  }

  return <>
    <TextField
      id="task"
      label="Task"
      name="task"
      value={todo.task}
      onKeyDown={e => {
        if ('Enter' === e.key) {
          void handleSubmit();
        }
      }}
      onChange={e => setTodo({ task: e.target.value })}
    />
  </>;
}

export default Todos;
```
