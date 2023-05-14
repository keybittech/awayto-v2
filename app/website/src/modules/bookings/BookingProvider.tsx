import { useMemo, useState } from "react";

import { IBooking } from 'awayto/core';
import { sh, useContexts } from 'awayto/hooks';

export function BookingProvider ({ children }: IProps): React.JSX.Element {

  const { BookingContext } = useContexts();

  const [bookingValuesChanged, setBookingValuesChanged] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking[]>([]);

  const { data : profile } = sh.useGetUserProfileDetailsQuery();

  const bookingValues = useMemo(() => Object.values(profile?.bookings || {}), [profile]);

  const bookingContext = {
    bookingValues,
    setBookingValuesChanged,
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

  return useMemo(() => !BookingContext ? <></> :
    <BookingContext.Provider value={bookingContext}>
      {children}
    </BookingContext.Provider>,
    [BookingContext, bookingContext]
  );
  
}

export default BookingProvider;