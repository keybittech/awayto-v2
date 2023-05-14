import { ApiOptions, EndpointType } from './api';
import { IFile } from './file';

/**
 * @category Group Files
 */
export type IGroupFiles = IFile & {
  groupId: string;
  fileId: string;
}

/**
 * @category Group Files
 */
export default {
  postGroupFile: {
    kind: EndpointType.MUTATION,
    url: 'group_files',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupId: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  putGroupFile: {
    kind: EndpointType.MUTATION,
    url: 'group_files',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, groupId: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  getGroupFiles: {
    kind: EndpointType.QUERY,
    url: 'group_files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupId: '' as string },
    resultType: { id: '' as string }
  },
  getGroupFileById: {
    kind: EndpointType.QUERY,
    url: 'group_files/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupId: '' as string, id: '' as string },
    resultType: {} as IGroupFiles
  },
  deleteGroupFile: {
    kind: EndpointType.MUTATION,
    url: 'group_files/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;