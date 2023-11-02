import { ApiOptions, EndpointType } from './api';
import { Void } from '../util';

export type ITodo = {
  id: string;
  task: string;
  done: boolean;
  createdAt: string;
  row: number;
}

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