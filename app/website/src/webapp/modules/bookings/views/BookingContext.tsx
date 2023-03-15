import { IBooking } from "awayto";
import { createContext } from "react";

export type BookingContextType = {
  bookingValues: IBooking[];
  bookingValuesChanged: boolean;
  selectedBooking: IBooking[];
  setSelectedBooking: (quotes: IBooking[]) => void;
  handleSelectPendingBooking: (prop: IBooking) => void;
  handleSelectPendingBookingAll: () => void;
}

export const BookingContext = createContext<BookingContextType | null>(null);