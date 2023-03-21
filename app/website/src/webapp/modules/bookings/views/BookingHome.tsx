import React, { useEffect } from "react";

import { useApi } from "awayto-hooks";
import { IBookingActionTypes } from "awayto";

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