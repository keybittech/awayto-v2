import { Reducer } from 'redux';
import {
  IBookingState,
  IBookingActions,
  IBookingActionTypes,
  IGetBookingByIdAction,
  IGetBookingsAction,
  IDeleteBookingAction,
  IDisableBookingAction,
  IPostBookingAction,
  IPutBookingAction
} from 'awayto';

const initialBookingState = {
  bookings: {}
} as IBookingState;

function reduceDeleteBooking(state: IBookingState, action: IDeleteBookingAction): IBookingState {
  const bookings = { ...state.bookings };
  action.payload.forEach(booking => {
    delete bookings[booking.id];
  });
  state.bookings = bookings;
  return { ...state };
}

function reduceBookings(state: IBookingState, action: IGetBookingsAction | IDisableBookingAction | IGetBookingByIdAction | IPostBookingAction | IPutBookingAction): IBookingState {
  const bookings = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.bookings = { ...state.bookings, ...bookings };
  return { ...state };
}

const bookingReducer: Reducer<IBookingState, IBookingActions> = (state = initialBookingState, action) => {
  switch (action.type) {
    case IBookingActionTypes.DELETE_BOOKING:
      return reduceDeleteBooking(state, action);
    case IBookingActionTypes.PUT_BOOKING:
    case IBookingActionTypes.POST_BOOKING:
    case IBookingActionTypes.GET_BOOKING_BY_ID:
      // return reduceBooking(state, action);
    case IBookingActionTypes.DISABLE_BOOKING:
    case IBookingActionTypes.GET_BOOKINGS:
      return reduceBookings(state, action);
    default:
      return state;
  }
};

export default bookingReducer;

export const persist = true;