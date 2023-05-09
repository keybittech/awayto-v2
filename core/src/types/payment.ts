import { AnyRecord, Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Payment
 * @purpose records the metadata of monetary transactions that occur in the application
 */
export type IPayment = {
  id: string;
  contactId: string;
  details: AnyRecord;
};

/**
 * @category Payment
 */
export default {
  postPayment: {
    kind: EndpointType.MUTATION,
    url: 'payments',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {} as IPayment,
    resultType: {} as IPayment
  },
  putPayment: {
    kind: EndpointType.MUTATION,
    url: 'payments',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IPayment,
    resultType: {} as IPayment
  },
  getPayments: {
    kind: EndpointType.QUERY,
    url: 'payments',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IPayment[]
  },
  getPaymentById: {
    kind: EndpointType.QUERY,
    url: 'payments/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IPayment
  },
  deletePayment: {
    kind: EndpointType.MUTATION,
    url: 'payments/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IPayment
  },
  disablePayment: {
    kind: EndpointType.MUTATION,
    url: 'payments/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;