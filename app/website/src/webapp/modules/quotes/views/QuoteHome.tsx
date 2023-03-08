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

import { IQuoteActionTypes, IQuote, IBookingActionTypes, IUtilActionTypes, IBooking, utcDTLocal, scheduleTime, plural, shortNSweet } from "awayto";
import { useRedux, useApi, useAct } from "awayto-hooks";

const { POST_BOOKING } = IBookingActionTypes;
const { GET_QUOTES, DISABLE_QUOTE } = IQuoteActionTypes;
const { SET_SNACK, OPEN_CONFIRM } = IUtilActionTypes;

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
    { name: 'Requested Time', selector: row => shortNSweet(row.slotDate, row.startTime) },
    { name: 'Requested On', selector: row => utcDTLocal(row.createdOn) }
  ] as TableColumn<IQuote>[], []);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
    ] : [];

    return [
      ...acts,
      <Tooltip key={'approve_quote'} title="Approve">
        <IconButton onClick={() => {
          if (!selected.every(s => s.slotDate === selected[0].slotDate && s.scheduleBracketSlotId === selected[0].scheduleBracketSlotId)) {
            act(SET_SNACK, { snackType: 'error', snackOn: 'Only appointments of the same date and time can be mass approved.' });
            return;
          }

          const { slotDate, startTime, scheduleBracketSlotId } = selected[0];

          const copies = Object.values(quotes).filter(q => !selected.some(s => s.id === q.id)).filter(q => q.slotDate === slotDate && q.scheduleBracketSlotId === scheduleBracketSlotId);

          void act(OPEN_CONFIRM, {
            isConfirming: true,
            confirmEffect: `Approve ${plural(selected.length, 'request', 'requests')}, creating ${plural(selected.length, 'booking', 'bookings')}, for ${shortNSweet(slotDate, startTime)}.`,
            confirmSideEffect: !copies.length ? undefined : {
              approvalAction: 'Auto-Deny Remaining',
              approvalEffect: `Automatically deny all other requests for ${shortNSweet(slotDate, startTime)} (this cannot be undone).`,
              rejectionAction: 'Confirm Request/Booking Only',
              rejectionEffect: 'Just submit the approvals.',
            },
            confirmAction: approval => {
              const [, res] = api(POST_BOOKING, { bookings: selected.map(s => ({ quoteId: s.id, slotDate: s.slotDate, scheduleBracketSlotId: s.scheduleBracketSlotId }) as IBooking) }, { load: true });
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
      </Tooltip>,
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