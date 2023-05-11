import { Void } from '../util';
import { ApiOptions, BufferResponse, EndpointType } from './api';

/**
 * @category File
 */
export interface IPreviewFile extends File {
  preview?: string;
}

/**
 * @category File
 */
export type IFileType = {
  id: string;
  name: string;
}

/**
 * @category File
 */
export type IFile = BufferResponse & {
  id: string;
  uuid: string;
  mimeType: string;
}

/**
 * @category File
 */
export default {
  postFileContents: {
    kind: EndpointType.MUTATION,
    url: 'files/content',
    method: 'POST',
    opts: {
      contentType: 'application/octet-stream'
    } as ApiOptions,
    queryArg: new ArrayBuffer(0),
    resultType: { id: '' as string }
  },
  putFileContents: {
    kind: EndpointType.MUTATION,
    url: 'files/content',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string, mimeType: '' as string },
    resultType: { success: true as boolean }
  },
  getFileContents: {
    kind: EndpointType.QUERY,
    url: 'files/content/:fileId',
    method: 'GET',
    opts: {
      cache: 'skip'
    } as ApiOptions,
    queryArg: { fileId: '' as string },
    resultType: { buffer: new ArrayBuffer(0), name: '' as string }
  },
  postFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { uuid: '' as string, name: '' as string, mimeType: '' as string },
    resultType: { id: '' as string, uuid: '' as string, name: '' as string }
  },
  putFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string }
  },
  getFiles: {
    kind: EndpointType.QUERY,
    url: 'files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IFile[]
  },
  getFileById: {
    kind: EndpointType.QUERY,
    url: 'files/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IFile
  },
  deleteFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  },
  disableFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;