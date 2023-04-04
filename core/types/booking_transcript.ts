import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IBookingTranscriptState> {}
}

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
export type IBookingTranscriptState = IBookingTranscript & {
  bookingTranscripts: Record<string, IBookingTranscript>;
};

/**
 * @category Action Types
 */
export enum IBookingTranscriptActionTypes {
  POST_BOOKING_TRANSCRIPT = "POST/booking_transcripts",
  PUT_BOOKING_TRANSCRIPT = "PUT/booking_transcripts",
  GET_BOOKING_TRANSCRIPTS = "GET/booking_transcripts",
  GET_BOOKING_TRANSCRIPT_BY_ID = "GET/booking_transcripts/:id",
  DELETE_BOOKING_TRANSCRIPT = "DELETE/booking_transcripts/:id",
  DISABLE_BOOKING_TRANSCRIPT = "PUT/booking_transcripts/:id/disable"
}
