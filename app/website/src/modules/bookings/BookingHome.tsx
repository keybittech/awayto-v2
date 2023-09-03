import React from 'react';
import { sh } from 'awayto/hooks';

export function BookingHome(): React.JSX.Element {

  const { data: bookings } = sh.useGetBookingsQuery();
  
  return <></>;
}

export default BookingHome;