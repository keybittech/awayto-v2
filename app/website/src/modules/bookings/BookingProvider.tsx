import { useMemo, useState } from "react";

import { IBooking } from 'awayto/core';
import { storeApi } from 'awayto/hooks';

import { BookingContext, BookingContextType } from "./BookingContext";

export function BookingProvider ({ children }: IProps): JSX.Element {

  const [bookingValuesChanged, setBookingValuesChanged] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking[]>([]);

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const bookingValues = useMemo(() => Object.values(profile.bookings || {}), [profile]);

  const bookingValuesContext = {
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

  return <>
    <BookingContext.Provider value={bookingValuesContext}>
      {children}
    </BookingContext.Provider>
  </>;
  
}

export default BookingProvider;