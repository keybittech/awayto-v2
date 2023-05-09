import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Booking Transcript
 * @purpose tracks atomic part of Booking Transcript message details
 */
export type ITranscriptMessage = {
  words: string;
  duration: number;
  timestamp: string;
  username: string;
}

/**
 * @category Booking Transcript
 * @purpose holds the log of the conversation between participants of an Exchange
 */
export type IBookingTranscript = {
  username: string;
  messages: ITranscriptMessage[];
}

/**
 * @category Booking Transcript
 */
export default {
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
