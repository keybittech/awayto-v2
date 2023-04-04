import { Merge } from '../util';
import { IQuote } from './quote';
import { siteApiRef, EndpointType, ApiProps, Void } from './api';
import { IBookingTranscript } from './booking_transcript';

declare global {
  interface IMergedState extends Merge<IBookingState> {}
}

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
export type IBookingState = IBooking & {
  bookings: Record<string, IBooking>;
};

/**
 * @category Action Types
 */
export enum IBookingActionTypes {
  POST_BOOKING = "POST/bookings",
  PUT_BOOKING = "PUT/bookings",
  GET_BOOKINGS = "GET/bookings",
  GET_BOOKING_BY_ID = "GET/bookings/:id",
  DELETE_BOOKING = "DELETE/bookings/:id",
  DISABLE_BOOKING = "PUT/bookings/:id/disable"
}



type ApiEndpointConfig<QA, RT> = {
  kind: EndpointType;
  url: string;
  method: string;
  queryArg: QA;
  resultType: RT;
  apiHandler: (props: ApiProps<QA>) => Promise<RT>;
};

const bookingApi = {
  getBooking: {
    kind: EndpointType.QUERY,
    url: 'bookings',
    method: 'GET',
    queryArg: {} as Void,
    resultType: {} as IBooking,
    // apiHandler: async props => {
    //   const response = await props.db.query<IBooking>(`
    //     SELECT eb.*
    //     FROM dbview_schema.enabled_bookings eb
    //     JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eb."scheduleBracketSlotId"
    //     WHERE eb."createdSub" = $1 OR sbs.created_sub = $1
    //   `, [props.event.userSub]);
    //   return response;
    // }
  }
} as const


// const bookingApi = {
//   getBooking: {
//     kind: EndpointType.QUERY,
//     url: 'bookings',
//     method: 'GET',
//     queryArg: { _void: null as never },
//     resultType: {} as IBooking[],
//     apiHandler: async (props: ApiHandler) => {
//       const response = await props.db.query<IBooking>(`
//         SELECT eb.*
//         FROM dbview_schema.enabled_bookings eb
//         JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eb."scheduleBracketSlotId"
//         WHERE eb."createdSub" = $1 OR sbs.created_sub = $1
//       `, [props.event.userSub]);
//       return response.rows;
//     }
//   },
//   getBookingById: {
//     kind: EndpointType.QUERY,
//     url: 'bookings/:id',
//     method: 'GET',
//     queryArg: { id: '' as string },
//     resultType: {} as IBooking,
//     apiHandler: async (props: ApiHandler<undefined, { id: string }>) => {
//       const response = await props.db.query<IBooking>(`
//         SELECT * FROM dbview_schema.enabled_bookings_ext
//         WHERE id = $1
//       `, [props.event.pathParameters.id]);
//       return response.rows;
//     }
//   },
//   putBooking: {
//     kind: EndpointType.MUTATION,
//     url: 'bookings',
//     method: 'PUT',
//     queryArg: { groupName: '' as string },
//     resultType: {} as IBooking,
//     apiHandler: async (props: ApiHandler<IBooking>) => {
//       const { id, serviceTierId } = props.event.body;
//       if (!id) throw new Error('invalid request, no booking id');
//       const updateProps = buildUpdate({
//         id,
//         service_tier_id: serviceTierId,
//         updated_sub: props.event.userSub,
//         updated_on: utcNowString()
//       });
//       const response = await props.db.query<IBooking>(`
//         UPDATE dbtable_schema.bookings
//         SET ${updateProps.string}
//         WHERE id = $1
//         RETURNING id, serviceTierId, paymentId, agreement, description
//       `, updateProps.array);

//       return response.rows[0];
//     }
//   }
// } as const;

type BookingApi = typeof bookingApi;

declare module './api' {
  interface SiteApiRef extends ExtendApi<BookingApi> {}
}

Object.assign(siteApiRef, bookingApi);
