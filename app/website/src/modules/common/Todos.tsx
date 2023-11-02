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