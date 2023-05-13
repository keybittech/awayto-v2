import React from 'react';
import { sh } from 'awayto/hooks';

export function BookingHome(): React.JSX.Element {

  const { data: bookings } = sh.useGetBookingsQuery();
  
  console.log({ bookings })

  return <></>;
}

export default BookingHome;