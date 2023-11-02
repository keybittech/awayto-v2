import { createHandlers, nid } from 'awayto/core';

export default createHandlers({
  postTodo: async props => {
    const id = nid('v4') as string;
    return { id };
  }
})