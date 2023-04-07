import React from 'react';
import dayjs from 'dayjs';

import { useGrid, sh } from 'awayto/hooks';
import { useParams } from 'react-router';

export function ManageFeedbacks(): JSX.Element {

  const { groupName } = useParams();
  if (!groupName) return <></>;
  
  const { data: feedbacks } = sh.useGetGroupFeedbackQuery({ groupName });
  if (!feedbacks) return <></>;

  const FeedbackGrid = useGrid({
    rows: feedbacks,
    columns: [
      { flex: 1, headerName: 'User', field: 'username' },
      { flex: 1, headerName: 'Message', field: 'message' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs(row.createdOn).format("YYYY-MM-DD hh:mm a") }
    ]
  });

  return <FeedbackGrid />
}

export default ManageFeedbacks;