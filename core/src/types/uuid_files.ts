import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Uuid Files
 */
export type IUuidFiles = {
  id: string;
  parentUuid: string;
  fileId: string;
}

/**
 * @category Uuid Files
 */
export default {
  postUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  putUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  getUuidFiles: {
    kind: EndpointType.QUERY,
    url: 'uuid_files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IUuidFiles[]
  },
  getUuidFileById: {
    kind: EndpointType.QUERY,
    url: 'uuid_files/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidFiles
  },
  deleteUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidFiles
  },
  disableUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  }
} as const;