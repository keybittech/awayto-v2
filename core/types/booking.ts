import { Void, Extend } from '../util';
import { IQuote } from './quote';
import { siteApiRef, EndpointType, ApiHandler, buildUpdate, siteApiHandlerRef } from './api';
import { IBookingTranscript } from './booking_transcript';
import { utcNowString } from './time_unit';

/**
 * @category Booking
 */
export type IBooking = IQuote & {
  quoteId: string;
  quoteSub: string;
  transcripts: IBookingTranscript[];
};

/**
 * @category Booking
 */
const bookingApi = {
  postBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings',
    method: 'POST',
    cache: true,
    queryArg: { bookings: [] as IBooking[] },
    resultType: [] as IBooking[]
  },
  putBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings',
    method: 'PUT',
    cache: true,
    queryArg: {} as IBooking,
    resultType: {} as IBooking
  },
  getBookings: {
    kind: EndpointType.QUERY,
    url: 'bookings',
    method: 'GET',
    cache: 180,
    queryArg: {} as Void,
    resultType: [] as IBooking[]
  },
  getBookingById: {
    kind: EndpointType.QUERY,
    url: 'bookings/:id',
    method: 'GET',
    cache: true,
    queryArg: { id: '' as string },
    resultType: {} as IBooking
  },
  deleteBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings/:id',
    method: 'DELETE',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id : '' as string }
  },
  disableBooking: {
    kind: EndpointType.MUTATION,
    url: 'bookings/:id/disable',
    method: 'PUT',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Booking
 */
const bookingApiHandlers: ApiHandler<typeof bookingApi> = {
  postBooking: async props => {
    const { bookings } = props.event.body;

    const newBookings: IBooking[] = [];
    for (const bookingTempId in bookings) {
      const booking = bookings[bookingTempId];
      const { quoteId, slotDate, scheduleBracketSlotId } = booking;

      const { id: bookingId } = await props.db.one<IBooking>(`
        INSERT INTO dbtable_schema.bookings (quote_id, slot_date, schedule_bracket_slot_id, created_sub)
        VALUES ($1::uuid, $2::date, $3::uuid, $4::uuid)
        RETURNING id
      `, [quoteId, slotDate, scheduleBracketSlotId, props.event.userSub]);

      booking.id = bookingId;
      newBookings.push(booking);
    }

    await props.redis.del(`${props.event.userSub}profile/details`);
    return newBookings;
  },
  putBooking: async props => {
    const { id, serviceTierId } = props.event.body;
    const updateProps = buildUpdate({
      id,
      service_tier_id: serviceTierId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });
    const booking = await props.db.one<IBooking>(`
      UPDATE dbtable_schema.bookings
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, serviceTierId, paymentId, agreement, description
    `, updateProps.array);
    return booking;
  },
  getBookings: async props => {
    const response = await props.db.manyOrNone<IBooking>(`
      SELECT eb.*
      FROM dbview_schema.enabled_bookings eb
      JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eb."scheduleBracketSlotId"
      WHERE eb."createdSub" = $1 OR sbs.created_sub = $1
    `, [props.event.userSub]);
    return response;
  },
  getBookingById: async props => {
    const { id } = props.event.pathParameters;
    const booking = await props.db.one<IBooking>(`
      SELECT * FROM dbview_schema.enabled_bookings_ext
      WHERE id = $1
    `, [id]);
    return booking;
  },
  deleteBooking: async props => {
    const { id } = props.event.pathParameters;
    await props.db.none(`
      DELETE FROM dbtable_schema.bookings
      WHERE id = $1
    `, [id]);
    return { id };
  },
  disableBooking: async props => {
    const { id } = props.event.pathParameters;
    await props.db.none(`
      UPDATE dbtable_schema.bookings
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);
    return { id };
  },
}

type BookingApi = typeof bookingApi;
type BookingApiHandler = typeof bookingApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<BookingApi> { }
  interface SiteApiHandlerRef extends Extend<BookingApiHandler> { }
}

Object.assign(siteApiRef, bookingApi);
Object.assign(siteApiHandlerRef, bookingApiHandlers);
