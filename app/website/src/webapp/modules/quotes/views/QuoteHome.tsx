import React, { useCallback, useMemo, useContext } from "react";
import DataTable, { TableColumn } from 'react-data-table-component';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import ApprovalIcon from '@mui/icons-material/Approval';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import { IQuote, utcDTLocal, shortNSweet } from "awayto";
import { useRedux, } from "awayto-hooks";
import { PendingQuotesContext, PendingQuotesContextType } from "./PendingQuotesContext";

function QuoteHome(): JSX.Element {

  const {
    pendingQuotes,
    pendingQuotesChanged,
    selectedPendingQuotes,
    setSelectedPendingQuotes,
    approvePendingQuotes,
    denyPendingQuotes
  } = useContext(PendingQuotesContext) as PendingQuotesContextType;

  const util = useRedux(state => state.util);

  const updateState = useCallback((state: { selectedRows: IQuote[] }) => setSelectedPendingQuotes(state.selectedRows), [setSelectedPendingQuotes]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Booking Slot', selector: row => shortNSweet(row.slotDate, row.startTime) },
    { name: 'Service', selector: row => row.serviceName },
    { name: 'Tier', selector: row => row.serviceTierName },
    { name: 'Requested On', selector: row => utcDTLocal(row.createdOn) }
  ] as TableColumn<IQuote>[], []);

  const actions = useMemo(() => {
    const { length } = selectedPendingQuotes;
    const acts = length == 1 ? [
    ] : [];

    return [
      ...acts,
      <Tooltip key={'approve_quote'} title="Approve">
        <IconButton onClick={approvePendingQuotes}>
          <ApprovalIcon />
        </IconButton>
      </Tooltip>,
      <Tooltip key={'deny_quote'} title="Deny">
        <IconButton onClick={denyPendingQuotes}>
          <DoNotDisturbIcon />
        </IconButton>
      </Tooltip>
    ]
  }, [selectedPendingQuotes]);

  return <Box mb={4}>
    <Card>
      <CardContent>

        <DataTable
          title="Pending Requests"
          contextActions={actions}
          data={pendingQuotes}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          theme={util.theme}
          columns={columns}
          selectableRows
          selectableRowsHighlight={true}
          onSelectedRowsChange={updateState}
          clearSelectedRows={pendingQuotesChanged}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </Box>
}

export default QuoteHome;