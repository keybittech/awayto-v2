import { Void } from '../util';
import { IQuote } from './quote';
import { EndpointType, ApiOptions } from './api';
import { IBookingTranscript } from './booking_transcript';
import { IFile } from './file';
import { IFormVersionSubmission } from './form';

/**
 * @category Booking
 * @purpose establishes a confirmed appointment derived from a Quote, holds transcript during Exchange
 */
export type IBooking = IQuote & {
  quoteId: string;
  quoteSub: string;
  serviceId: string;
  serviceFormId?: string;
  serviceSurveyId?: string;
  serviceSurvey?: IFormVersionSubmission;
  serviceSurveyVersionSubmissionId: string;
  tierFormId?: string;
  tierSurveyId?: string;
  tierSurvey?: IFormVersionSubmission;
  tierSurveyVersionSubmissionId: string;
  transcripts: IBookingTranscript[];
};

/**
 * @category Booking
 */
export default {
  postBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { bookings: [] as IBooking[] },
    resultType: [] as IBooking[]
  },
  putBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IBooking,
    resultType: {} as IBooking
  },
  getBookings: {
    kind: EndpointType.QUERY,
    url: 'bookings',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IBooking[]
  },
  getBookingById: {
    kind: EndpointType.QUERY,
    url: 'bookings/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IBooking
  },
  getBookingFiles: {
    kind: EndpointType.QUERY,
    url: 'bookings/:id/files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: [] as IFile[]
  },
  // getBookingSummary: {
  //   kind: EndpointType.QUERY,
  //   url: 'bookings/:id/summary',
  //   method: 'GET',
  //   opts: {} as ApiOptions,
  //   queryArg: { id: '' as string },
  //   resultType: {} as IBooking
  // },
  // putBookingSummary: {
  //   kind: EndpointType.MUTATION
  // },
  deleteBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id : '' as string }
  },
  disableBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;