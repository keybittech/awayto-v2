import { useMemo, useState } from "react";

import { IBooking, IUtilActionTypes, IBookingActionTypes, IUserProfileActionTypes } from "awayto";
import { useAct, useApi, useRedux } from "awayto-hooks";

import { BookingContext, BookingContextType } from "./BookingContext";

export function BookingProvider ({ children }: IProps): JSX.Element {

  const act = useAct();
  const api = useApi();

  const [bookingValuesChanged, setBookingValuesChanged] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking[]>([]);

  const { bookings } = useRedux(state => state.profile);

  const bookingValues = useMemo(() => Array.from(bookings.values()), [bookings]);

  const bookingValuesContext = {
    bookingValues,
    bookingValuesChanged,
    selectedBooking,
    setSelectedBooking,
    handleSelectPendingBooking(booking) {
      const currentIndex = selectedBooking.indexOf(booking);
      const newChecked = [...selectedBooking];

      if (currentIndex === -1) {
        newChecked.push(booking);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setSelectedBooking(newChecked);
    },
    handleSelectPendingBookingAll() {
      const bookingValuesSet = selectedBooking.length === bookingValues.length ?
        selectedBooking.filter(v => !bookingValues.includes(v)) :
        [...selectedBooking, ...bookingValues.filter(v => !selectedBooking.includes(v))];
      
      setSelectedBooking(bookingValuesSet);
    }
  } as BookingContextType | null;

  return <>
    <BookingContext.Provider value={bookingValuesContext}>
      {children}
    </BookingContext.Provider>
  </>;
  
}

export default BookingProvider;