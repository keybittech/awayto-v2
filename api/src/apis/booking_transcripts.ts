import { asyncForEach, IBookingTranscriptActionTypes, utcNowString } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IBookingTranscript } from 'awayto';

const bookings: ApiModule = [

  {
    action: IBookingTranscriptActionTypes.POST_BOOKING_TRANSCRIPT,
    cmnd : async (props) => {
      try {

        
        return true;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IBookingTranscriptActionTypes.PUT_BOOKING_TRANSCRIPT,
    cmnd : async (props) => {
      try {
        
        return true;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingTranscriptActionTypes.GET_BOOKING_TRANSCRIPTS,
    cmnd : async (props) => {
      try {

        
        return true;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingTranscriptActionTypes.GET_BOOKING_TRANSCRIPT_BY_ID,
    cmnd : async (props) => {
      try {
        
        return true;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingTranscriptActionTypes.DELETE_BOOKING_TRANSCRIPT,
    cmnd : async (props) => {
      try {
        
        return true;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IBookingTranscriptActionTypes.DISABLE_BOOKING_TRANSCRIPT,
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