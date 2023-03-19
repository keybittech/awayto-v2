import React, { useEffect, useMemo } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import dayjs from 'dayjs';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { IFeedback, IFeedbackActionTypes } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';
import { useParams } from 'react-router';

const { GET_FEEDBACK } = IFeedbackActionTypes;

export function ManageFeedbacks(): JSX.Element {

  const api = useApi();
  const { groupName } = useParams();
  const util = useRedux(state => state.util);
  const { feedbacks } = useRedux(state => state.feedback);

  useEffect(() => {
    const [abort, res] = api(GET_FEEDBACK, { groupName });
    res?.catch(console.warn);
    return () => abort();
  }, []);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'User', selector: row => row.username },
    { name: 'Message', selector: row => row.message },
    { name: 'Created', selector: row => dayjs(row.createdOn).format("YYYY-MM-DD hh:mm a") }
  ] as TableColumn<IFeedback>[], []);

  return <>
    <Card>
      <CardContent>

        <DataTable
          title="User Feedback"
          data={Array.from(feedbacks.values())}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          theme={util.theme}
          columns={columns}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </>
}

export default ManageFeedbacks;