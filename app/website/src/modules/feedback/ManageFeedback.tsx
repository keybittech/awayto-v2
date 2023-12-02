import React from 'react';

import { DataGrid } from '@mui/x-data-grid';

import { useGrid, sh } from 'awayto/hooks';
import { dayjs } from 'awayto/core';

export function ManageFeedbacks(): React.JSX.Element {
  const { data: feedbacks } = sh.useGetGroupFeedbackQuery();

  const feedbackGridProps  = useGrid({
    rows: feedbacks || [],
    columns: [
      { flex: 1, headerName: 'Message', field: 'message' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs(row.createdOn).format("YYYY-MM-DD hh:mm a") }
    ]
  });

  return <DataGrid {...feedbackGridProps}  />
}

export default ManageFeedbacks;
