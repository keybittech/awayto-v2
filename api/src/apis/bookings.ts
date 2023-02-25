import { asyncForEach, IBookingActionTypes, utcNowString } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IBooking, IBookingScheduleBracket, IScheduleBracket, ITimeUnit, ITimeUnitNames } from 'awayto';

const bookings: ApiModule = [

  {
    action: IBookingActionTypes.POST_BOOKING,
    cmnd : async (props) => {
      try {



        const { serviceTierId, contactId, paymentId, agreement, description, bookingScheduleBrackets } = props.event.body;

        const booking = (await props.db.query<IBooking>(`
          INSERT INTO dbtable_schema.bookings (service_tier_id, contact_id, payment_id, agreement, description, created_sub)
          VALUES ($1, $2, $3, $4, $5, $6::uuid)
          RETURNING id, service_tier_id as "serviceTierId", contact_id as "contactId", payment_id as "paymentId", agreement, description
        `, [serviceTierId, contactId, paymentId, agreement, description, props.event.userSub])).rows[0];
        
        const dbBookingScheduleBrackets = {} as Record<string, IBookingScheduleBracket>;

        await asyncForEach(Object.values(bookingScheduleBrackets), async b => {
          const dbBookingScheduleBracket = (await props.db.query<IBookingScheduleBracket>(`
            INSERT INTO dbtable_schema.booking_schedule_brackets (booking_id, schedule_bracket_id, hours, created_sub)
            VALUES ($1, $2, $3, $4::uuid)
            ON CONFLICT (booking_id, schedule_bracket_id) DO NOTHING
            RETURNING id, booking_id as "bookingId", schedule_bracket_id as "scheduleBracketId", hours
          `, [booking.id, b.id, b.hours, props.event.userSub])).rows[0];

          const scheduleBracket = (await props.db.query<IScheduleBracket>(`
            SELECT * FROM dbtable_schema.schedule_brackets
            WHERE id = $1;
          `, [dbBookingScheduleBracket.scheduleBracketId])).rows[0];

          dbBookingScheduleBracket.bracket = scheduleBracket;

          dbBookingScheduleBrackets[scheduleBracket.id] = dbBookingScheduleBracket
        });

        booking.bookingScheduleBrackets = dbBookingScheduleBrackets;

        return booking;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IBookingActionTypes.PUT_BOOKING,
    cmnd : async (props) => {
      try {
        const { id, serviceTierId, contactId, paymentId, agreement, description } = props.event.body;

        if (!id) throw new Error('invalid request, no booking id');

        const updateProps = buildUpdate({
          id,
          service_tier_id: serviceTierId,
          contact_id: contactId,
          payment_id: paymentId,
          agreement,
          description,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IBooking>(`
          UPDATE dbtable_schema.bookings
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, serviceTierId, contactId, paymentId, agreement, description
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingActionTypes.GET_BOOKINGS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IBooking>(`
          SELECT * FROM dbview_schema.enabled_bookings
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingActionTypes.GET_BOOKING_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IBooking>(`
          SELECT * FROM dbview_schema.enabled_bookings_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingActionTypes.DELETE_BOOKING,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IBooking>(`
          DELETE FROM dbtable_schema.bookings
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingActionTypes.DISABLE_BOOKING,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.bookings
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default bookings;