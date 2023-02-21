import { IScheduleBracket } from 'awayto';
import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    booking: IBookingState
  }

  interface IMergedState extends Merge<unknown, IBookingState> {}

  /**
   * @category Awayto Redux
   */
  type IBookingModuleActions = IBookingActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    booking: IBookingActionTypes;
  }
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
export type IBooking = {
  id: string;
  serviceTierId: string;
  bookingScheduleBrackets: Record<string, IBookingScheduleBracket>;
  contactId: string;
  description: string;
  paymentId: string;
  agreement: boolean;
};

/**
 * @category Booking
 */
export type IBookingState = IBooking & {
  bookings: Record<string, IBooking>;
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
