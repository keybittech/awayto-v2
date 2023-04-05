import React, { useEffect } from "react";

import { IBookingActionTypes } from 'awayto/core';
import { useApi } from 'awayto/hooks';

const { GET_BOOKINGS } = IBookingActionTypes;

export function BookingHome(): JSX.Element {

  const api = useApi();


  useEffect(() => {
    const [abort, res] = api(GET_BOOKINGS);
    res?.catch(console.warn);
    return () => abort();
  }, []);


  return <></>;
}

export default BookingHome;