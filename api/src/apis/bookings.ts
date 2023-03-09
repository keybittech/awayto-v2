import { asyncForEach, IBookingActionTypes, utcNowString } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IBooking } from 'awayto';

const bookings: ApiModule = [

  {
    action: IBookingActionTypes.POST_BOOKING,
    cmnd : async (props) => {
      try {

        const bookings = Object.values(props.event.body.bookings);

        await asyncForEach(bookings, async booking => {
          const { quoteId, slotDate, scheduleBracketSlotId } = booking;

          const { rows: [{ id: bookingId }]} = await props.db.query<IBooking>(`
            INSERT INTO dbtable_schema.bookings (quote_id, slot_date, schedule_bracket_slot_id, created_sub)
            VALUES ($1::uuid, $2::date, $3::uuid, $4::uuid)
            RETURNING id
          `, [quoteId, slotDate, scheduleBracketSlotId, props.event.userSub]);
  
          booking.id = bookingId;
        });
        
        await props.redis.del(`${props.event.userSub}profile/details`);

        return bookings;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IBookingActionTypes.PUT_BOOKING,
    cmnd : async (props) => {
      try {
        const { id, serviceTierId, contactId } = props.event.body;

        if (!id) throw new Error('invalid request, no booking id');

        const updateProps = buildUpdate({
          id,
          service_tier_id: serviceTierId,
          contact_id: contactId,
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