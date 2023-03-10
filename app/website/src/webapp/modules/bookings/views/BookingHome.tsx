import React, { useEffect } from "react";

import { useApi } from "awayto-hooks";
import { IBookingActionTypes } from "awayto";

const { GET_BOOKINGS } = IBookingActionTypes;

export function BookingHome(props: IProps) {

  const api = useApi();


  useEffect(() => {
    const [abort, res] = api(GET_BOOKINGS);
    res?.catch(console.warn);
    return () => abort();
  }, []);


  return <>suh</>;
}

export default BookingHome;