import { IQuote, IScheduleBracket } from 'awayto';
import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IBookingState & IBookingTranscriptState> {}
}

export type IBookingScheduleBracket = {
  id: string;
  bookingId: string;
  scheduleBracketId: string;
  bracket: IScheduleBracket;
  hours: number;
}

/**
 * @category Awayto
 */
export type IBooking = IQuote & {
  quoteId: string;
  quoteSub: string;
  transcripts: IBookingTranscript[];
};

/**
 * @category Booking
 */
export type IBookingState = IBooking & {
  bookings: Map<string, IBooking>;
};

/**
 * @category Action Types
 */
export enum IBookingActionTypes {
  POST_BOOKING = "POST/bookings",
  PUT_BOOKING = "PUT/bookings",
  GET_BOOKINGS = "GET/bookings",
  GET_BOOKING_BY_ID = "GET/bookings/:id",
  DELETE_BOOKING = "DELETE/bookings/:id",
  DISABLE_BOOKING = "PUT/bookings/:id/disable"
}

/**
 * @category Booking
 */
export type IPostBookingAction = PayloadAction<IBookingActionTypes.POST_BOOKING, IBooking[]>;

/**
 * @category Booking
 */
export type IPutBookingAction = PayloadAction<IBookingActionTypes.PUT_BOOKING, IBooking[]>;

/**
 * @category Booking
 */
export type IGetBookingsAction = PayloadAction<IBookingActionTypes.GET_BOOKINGS, IBooking[]>;

/**
 * @category Booking
 */
export type IGetBookingByIdAction = PayloadAction<IBookingActionTypes.GET_BOOKING_BY_ID, IBooking[]>;

/**
 * @category Booking
 */
export type IDeleteBookingAction = PayloadAction<IBookingActionTypes.DELETE_BOOKING, IBooking[]>;

/**
 * @category Booking
 */
export type IDisableBookingAction = PayloadAction<IBookingActionTypes.DISABLE_BOOKING, IBooking[]>;

/**
 * @category Booking
 */
export type IBookingActions = IPostBookingAction 
  | IPutBookingAction 
  | IGetBookingsAction 
  | IGetBookingByIdAction
  | IDeleteBookingAction
  | IDisableBookingAction;


export type ITranscriptMessage = {
  words: string;
  duration: number;
  timestamp: string;
  username: string;
}

/**
 * @category Booking
 */
export type IBookingTranscript = {
  username: string;
  messages: ITranscriptMessage[];
}

/**
 * @category Booking
 */
export type IBookingTranscriptState = IBookingTranscript & {
  bookingTranscripts: Map<string, IBookingTranscript>;
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

/**
 * @category BookingTranscript
 */
export type IPostBookingTranscriptAction = PayloadAction<IBookingTranscriptActionTypes.POST_BOOKING_TRANSCRIPT, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IPutBookingTranscriptAction = PayloadAction<IBookingTranscriptActionTypes.PUT_BOOKING_TRANSCRIPT, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IGetBookingTranscriptsAction = PayloadAction<IBookingTranscriptActionTypes.GET_BOOKING_TRANSCRIPTS, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IGetBookingTranscriptByIdAction = PayloadAction<IBookingTranscriptActionTypes.GET_BOOKING_TRANSCRIPT_BY_ID, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IDeleteBookingTranscriptAction = PayloadAction<IBookingTranscriptActionTypes.DELETE_BOOKING_TRANSCRIPT, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IDisableBookingTranscriptAction = PayloadAction<IBookingTranscriptActionTypes.DISABLE_BOOKING_TRANSCRIPT, IBookingTranscript[]>;

/**
 * @category BookingTranscript
 */
export type IBookingTranscriptActions = IPostBookingTranscriptAction 
  | IPutBookingTranscriptAction 
  | IGetBookingTranscriptsAction 
  | IGetBookingTranscriptByIdAction
  | IDeleteBookingTranscriptAction
  | IDisableBookingTranscriptAction;