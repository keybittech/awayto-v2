import { ApiModule, buildUpdate, asyncForEach } from '../util/db';
import { IBooking, IBookingScheduleBracket, IScheduleBracket, IScheduleContext, ITimeUnit } from 'awayto';

const bookings: ApiModule = [

  {
    method: 'POST',
    path : 'bookings',
    cmnd : async (props) => {
      try {

        const { serviceTierId, contactId, paymentId, agreement, description, brackets } = props.event.body as IBooking;

        const booking = (await props.client.query<IBooking>(`
          INSERT INTO bookings (service_tier_id, contact_id, payment_id, agreement, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, service_tier_id as "serviceTierId", contact_id as "contactId", payment_id as "paymentId", agreement, description
        `, [serviceTierId, contactId, paymentId, agreement, description])).rows[0];
        
        const dbBookingScheduleBrackets = [] as IBookingScheduleBracket[];

        await asyncForEach(brackets, async b => {
          const dbBookingScheduleBracket = (await props.client.query<IBookingScheduleBracket>(`
            INSERT INTO booking_schedule_brackets (booking_id, schedule_bracket_id, hours)
            VALUES ($1, $2, $3)
            ON CONFLICT (booking_id, schedule_bracket_id) DO NOTHING
            RETURNING id, booking_id as "bookingId", schedule_bracket_id as "scheduleBracketId", hours
          `, [booking.id, b.id, b.hours])).rows[0];

          const scheduleBracket = (await props.client.query<IScheduleBracket>(`
            SELECT * FROM schedule_brackets
            WHERE id = $1;
          `, [dbBookingScheduleBracket.scheduleBracketId])).rows[0];

          const scheduleContext = (await props.client.query<IScheduleContext>(`
            SELECT * FROM schedule_contexts
            WHERE id = $1;
          `, [scheduleBracket.scheduleContextId])).rows[0];

          scheduleBracket.scheduleContextName = scheduleContext.name as ITimeUnit;

          dbBookingScheduleBracket.bracket = scheduleBracket;

          dbBookingScheduleBrackets.push(dbBookingScheduleBracket);
        });

        booking.brackets = dbBookingScheduleBrackets;

        return booking;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'bookings',
    cmnd : async (props) => {
      try {
        const { id, serviceTierId, contactId, paymentId, agreement, description } = props.event.body as IBooking;

        if (!id) throw new Error('invalid request, no booking id');

        const updateProps = buildUpdate({ id, serviceTierId, contactId, paymentId, agreement, description });

        const response = await props.client.query<IBooking>(`
          UPDATE bookings
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
    method: 'GET',
    path : 'bookings',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IBooking>(`
          SELECT * FROM dbview_schema.enabled_bookings
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'bookings/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IBooking>(`
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
    method: 'DELETE',
    path : 'bookings/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IBooking>(`
          DELETE FROM bookings
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'bookings/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE bookings
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default bookings;