import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IFile } from './file';
import { IFormVersionSubmission } from './form';

/**
 * @category Quote
 * @purpose records all available data for a potential appointment as requested by a Group user that must be finalized with a Booking
 */
export type IQuote = {
  id: string;
  slotDate: string;
  startTime: string;
  username: string;
  serviceTierId: string;
  serviceTierName: string;
  serviceName: string;
  files: IFile[];
  scheduleBracketSlotId: string;
  serviceFormVersionSubmissionId: string;
  tierFormVersionSubmissionId: string;
  serviceForm?: IFormVersionSubmission;
  tierForm?: IFormVersionSubmission;
  createdOn: string;
};

/**
 * @category Quote
 */
export default {
  postQuote: {
    kind: EndpointType.MUTATION,
    url: 'quotes',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {
      scheduleBracketSlotId: ''  as string,
      serviceTierId: '' as string,
      slotDate: '' as string,
      serviceForm: {} as IFormVersionSubmission,
      tierForm: {} as IFormVersionSubmission,
      files: [] as IFile[]
    },
    resultType: [] as IQuote[]
  },
  putQuote: {
    kind: EndpointType.MUTATION,
    url: 'quotes',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, serviceTierId: '' as string },
    resultType: {} as IQuote
  },
  getQuotes: {
    kind: EndpointType.QUERY,
    url: 'quotes',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IQuote[]
  },
  getQuoteById: {
    kind: EndpointType.QUERY,
    url: 'quotes/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IQuote
  },
  deleteQuote: {
    kind: EndpointType.MUTATION,
    url: 'quotes/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string },
  },
  disableQuote: {
    kind: EndpointType.MUTATION,
    url: 'quotes/disable/:ids',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;