import React, { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';

import { IFeedbackActionTypes } from 'awayto';
import { useRedux, useApi, useGrid } from 'awayto-hooks';
import { useParams } from 'react-router';

const { GET_FEEDBACK } = IFeedbackActionTypes;

export function ManageFeedbacks(): JSX.Element {

  const api = useApi();
  const { groupName } = useParams();
  const { feedbacks } = useRedux(state => state.feedback);

  useEffect(() => {
    const [abort, res] = api(GET_FEEDBACK, { groupName });
    res?.catch(console.warn);
    return () => abort();
  }, []);

  const FeedbackGrid = useGrid({
    rows: Array.from(feedbacks.values()),
    columns: [
      { flex: 1, headerName: 'User', field: 'username' },
      { flex: 1, headerName: 'Message', field: 'message' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs(row.createdOn).format("YYYY-MM-DD hh:mm a") }
    ]
  });

  return <FeedbackGrid />
}

export default ManageFeedbacks;