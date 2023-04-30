import React, { useMemo, useContext } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ApprovalIcon from '@mui/icons-material/Approval';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import { DataGrid } from '@mui/x-data-grid';

import { IQuote, utcDTLocal, shortNSweet } from 'awayto/core';
import { useGrid } from 'awayto/hooks';
import { PendingQuotesContext, PendingQuotesContextType } from './PendingQuotesContext';

function QuoteHome(): JSX.Element {

  const {
    pendingQuotes,
    selectedPendingQuotes,
    setSelectedPendingQuotes,
    approvePendingQuotes,
    denyPendingQuotes
  } = useContext(PendingQuotesContext) as PendingQuotesContextType;

  const actions = useMemo(() => {
    const { length } = selectedPendingQuotes;
    const acts = length == 1 ? [
      // Extra actions
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

  const quoteGridProps = useGrid<IQuote>({
    rows: pendingQuotes,
    columns: [
      { flex: 1, headerName: 'Booking Slot', field: 'slotDate', renderCell: ({ row }) => shortNSweet(row.slotDate, row.startTime) },
      { flex: 1, headerName: 'Service', field: 'serviceName' },
      { flex: 1, headerName: 'Tier', field: 'serviceTierName' },
      { flex: 1, headerName: 'Requested On', field: 'createdOn', renderCell: ({ row }) => utcDTLocal(row.createdOn) }
    ],
    selected: selectedPendingQuotes,
    onSelected: selection => setSelectedPendingQuotes(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Pending Requests</Typography>
      {!!selectedPendingQuotes.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });
  return <DataGrid {...quoteGridProps} />
}

export default QuoteHome;