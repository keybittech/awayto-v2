import { Reducer } from 'redux';
import {
  IBookingState,
  IBookingActions,
  IBookingActionTypes,
  IBooking,
  getMapFromArray
} from 'awayto';

const initialBookingState = {
  bookings: new Map()
} as IBookingState;

const bookingReducer: Reducer<IBookingState, IBookingActions> = (state = initialBookingState, action) => {
  switch (action.type) {
    case IBookingActionTypes.DELETE_BOOKING:
      action.payload.forEach(booking => {
        state.bookings.delete(booking.id);
      });
      return state;
    case IBookingActionTypes.PUT_BOOKING:
    case IBookingActionTypes.POST_BOOKING:
    case IBookingActionTypes.GET_BOOKING_BY_ID:
    case IBookingActionTypes.DISABLE_BOOKING:
    case IBookingActionTypes.GET_BOOKINGS:
      state.bookings = getMapFromArray<IBooking>(state.bookings, action.payload);
      return state;
    default:
      return state;
  }
};

export default bookingReducer;

export const persist = true;