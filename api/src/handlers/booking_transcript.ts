import { createHandlers, utcNowString } from 'awayto/core';

/**
 * @category Booking Transcript
 */
export default createHandlers({
  postBookingTranscript: async props => {
    return [];
  },
  putBookingTranscript: async props => {
    return {};
  },
  getBookingTranscripts: async props => {
    return [];
  },
  getBookingTranscriptById: async props => {
    return {};
  },
  deleteBookingTranscript: async props => {
    return {};
  },
  disableBookingTranscript: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.bookings
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  },
});