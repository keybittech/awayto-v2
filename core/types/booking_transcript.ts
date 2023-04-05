import { Extend, Void } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

/**
 * @category Booking Transcript
 */
export type ITranscriptMessage = {
  words: string;
  duration: number;
  timestamp: string;
  username: string;
}

/**
 * @category Booking Transcript
 */
export type IBookingTranscript = {
  username: string;
  messages: ITranscriptMessage[];
}

/**
 * @category Booking Transcript
 */
const bookingTranscriptApi = {
  postBookingTranscript: {
    kind: EndpointType.MUTATION,
    url: 'booking_transcripts',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { bookingTranscripts: [] as IBookingTranscript[] },
    resultType: [] as IBookingTranscript[]
  },
  putBookingTranscript: {
    kind: EndpointType.MUTATION,
    url: 'booking_transcripts',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IBookingTranscript,
    resultType: {} as IBookingTranscript
  },
  getBookingTranscripts: {
    kind: EndpointType.QUERY,
    url: 'booking_transcripts',
    method: 'GET',
    opts: { cache: 180 } as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IBookingTranscript[]
  },
  getBookingTranscriptById: {
    kind: EndpointType.QUERY,
    url: 'booking_transcripts/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IBookingTranscript
  },
  deleteBookingTranscript: {
    kind: EndpointType.MUTATION,
    url: 'booking_transcripts/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IBookingTranscript
  },
  disableBookingTranscript: {
    kind: EndpointType.MUTATION,
    url: 'booking_transcripts/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Booking Transcript
 */
const bookingTranscriptApiHandlers: ApiHandler<typeof bookingTranscriptApi> = {
  postBookingTranscript: async props => {
    return [];
  },
  putBookingTranscript: async props => {
    return {};
  },
  getBookingTranscripts: async props => {
    return [];
  },
  getBookingTranscriptById: async props => {
    return {};
  },
  deleteBookingTranscript: async props => {
    return {};
  },
  disableBookingTranscript: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.bookings
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  },
} as const;

/**
 * @category Booking Transcript
 */
type BookingTranscriptApi = typeof bookingTranscriptApi;

/**
 * @category Booking Transcript
 */
type BookingTranscriptApiHandler = typeof bookingTranscriptApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<BookingTranscriptApi> { }
  interface SiteApiHandlerRef extends Extend<BookingTranscriptApiHandler> { }
}

Object.assign(siteApiRef, bookingTranscriptApi);
Object.assign(siteApiHandlerRef, bookingTranscriptApiHandlers);
