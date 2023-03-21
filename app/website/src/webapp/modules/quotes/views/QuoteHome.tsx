import React, { useMemo, useContext } from "react";

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ApprovalIcon from '@mui/icons-material/Approval';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import { IQuote, utcDTLocal, shortNSweet } from "awayto";
import { useGrid } from "awayto-hooks";
import { PendingQuotesContext, PendingQuotesContextType } from "./PendingQuotesContext";

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

  const QuoteGrid = useGrid<IQuote>({
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
      {!!selectedPendingQuotes.length && <Box sx={{ float: 'right' }}>{actions}</Box>}
    </>
  });
  return <QuoteGrid />
}

export default QuoteHome;