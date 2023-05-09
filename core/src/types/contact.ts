import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Contact
 */
export type IContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

/**
 * @category Contact
 */
export default {
  postContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, email: '' as string, phone: '' as string },
    resultType: {} as IContact
  },
  putContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string, email: '' as string, phone: '' as string },
    resultType: {} as IContact
  },
  getContacts: {
    kind: EndpointType.QUERY,
    url: 'contacts',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IContact[]
  },
  getContactById: {
    kind: EndpointType.QUERY,
    url: 'contacts/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IContact
  },
  deleteContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  },
  disableContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;