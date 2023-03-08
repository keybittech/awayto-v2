import React, { useEffect, useState, useCallback, useMemo } from "react";
import DataTable, { TableColumn } from 'react-data-table-component';
import dayjs from "dayjs";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import ApprovalIcon from '@mui/icons-material/Approval';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import { IQuoteActionTypes, IQuote, IBookingActionTypes, IUtilActionTypes } from "awayto";
import { useRedux, useApi, useAct } from "awayto-hooks";

const { POST_BOOKING } = IBookingActionTypes;
const { GET_QUOTES, DISABLE_QUOTE } = IQuoteActionTypes;
const { OPEN_CONFIRM } = IUtilActionTypes;

function QuoteHome(props: IProps) {

  const api = useApi();
  const act = useAct();
  const util = useRedux(state => state.util);
  const [selected, setSelected] = useState<IQuote[]>([]);
  const [toggle, setToggle] = useState(false);

  const { quotes } = useRedux(state => state.quote);
  const updateState = useCallback((state: { selectedRows: IQuote[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Requested Date', selector: row => row.slotDate },
    { name: 'Requested Time', selector: row => dayjs(row.slotDate).startOf('week').add(dayjs.duration(row.startTime)).format("hh:mm a") },
    { name: 'Requested On', selector: row => dayjs.utc(row.createdOn).local().format("YYYY-MM-DD hh:mm a") }
  ] as TableColumn<IQuote>[], []);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'approve_quote'} title="Approve">
        <IconButton onClick={() => {
          const { id, slotDate, scheduleBracketSlotId } = selected[0];

          const copies = Object.values(quotes).filter(q => q.id !== id && q.slotDate === slotDate && q.scheduleBracketSlotId === scheduleBracketSlotId)

          void act(OPEN_CONFIRM, {
            isConfirming: true,
            confirmEffect: 'Approve a request and create a booking.',
            confirmRequest: !copies.length ? undefined : 'Would you also like to automatically deny all other requests for this same date and time (this cannot be undone)? ',
            confirmAction: approval => {
              const [, res] = api(POST_BOOKING, { quoteId: id, slotDate, scheduleBracketSlotId }, { load: true });
              res?.then(() => {
                const [, rez] = api(DISABLE_QUOTE, { ids: selected.concat(approval ? copies : []).map(s => s.id).join(',') });
                rez?.then(() => {
                  setToggle(!toggle);
                  api(GET_QUOTES);
                }).catch(console.warn);
              });
            }
          });

        }}>
          <ApprovalIcon />
        </IconButton>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'deny_quote'} title="Deny">
        <IconButton onClick={() => {
          const [, res] = api(DISABLE_QUOTE, { ids: selected.map(s => s.id).join(',') }, { load: true })
          res?.then(() => {
            setToggle(!toggle);
            api(GET_QUOTES);
          }).catch(console.warn);
        }}>
          <DoNotDisturbIcon />
        </IconButton>
      </Tooltip>
    ]
  }, [selected]);

  useEffect(() => {
    const [abort, res] = api(GET_QUOTES);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  return <Box mb={4}>
    <Card>
      <CardContent>

        <DataTable
          title="Pending Requests"
          contextActions={actions}
          data={quotes ? Object.values(quotes) : []}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          theme={util.theme}
          columns={columns}
          selectableRows
          selectableRowsHighlight={true}
          onSelectedRowsChange={updateState}
          clearSelectedRows={toggle}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </Box>
}

export default QuoteHome;