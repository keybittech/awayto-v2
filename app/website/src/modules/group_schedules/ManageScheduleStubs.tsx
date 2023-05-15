import React, { useState, useMemo, Suspense, useContext } from 'react';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';

import { DataGrid } from '@mui/x-data-grid';

import { IGroupUserScheduleStub, shortNSweet } from 'awayto/core';
import { useGrid, useComponents, useContexts } from 'awayto/hooks';

export function ManageScheduleStubs(): React.JSX.Element {
  
  const { ManageScheduleStubModal } = useComponents();

  const {
    getGroupUserScheduleStubs: {
      data: groupUserScheduleStubs,
      refetch: getGroupUserScheduleStubs
    }
  } = useContext(useContexts().GroupScheduleContext) as GroupScheduleContextType;

  const [stub, setStub] = useState<IGroupUserScheduleStub>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    return length == 1 ? [
      <Tooltip key={'review_schedule_issue'} title="Review Issue">
        <IconButton key={'manage_schedule_stub'} onClick={() => {
          setStub(groupUserScheduleStubs?.find(s => s.quoteId === selected[0]));
          setDialog('manage_schedule_stub');
          setSelected([]);
        }}>
          <CreateIcon />
        </IconButton>
      </Tooltip>
    ] : []
  }, [selected]);

  const scheduleStubGridProps = useGrid({
    rows: groupUserScheduleStubs || [],
    columns: [
      { flex: 1, headerName: 'Date', field: 'slotDate', renderCell: ({ row }) => shortNSweet(row.slotDate, row.startTime) },
      { flex: 1, headerName: 'Service', field: 'serviceName' },
      { flex: 1, headerName: 'Tier', field: 'tierName' },
      { flex: 1, headerName: 'Created', field: 'replacement', renderCell: ({ row }) => Object.keys(row.replacement || {}).length ? 'Yes' : 'No' }
    ],
    rowId: 'quoteId',
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Appointment Issues</Typography>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  return <>
    <Dialog open={dialog === 'manage_schedule_stub'} fullWidth maxWidth="sm">
      <Suspense>
        {stub ? <ManageScheduleStubModal editGroupUserScheduleStub={stub} closeModal={() => {
          setDialog('');
          getGroupUserScheduleStubs().catch(console.error);
        }} /> : <></>}
      </Suspense>
    </Dialog>

    <DataGrid {...scheduleStubGridProps} />
  </>
}

export default ManageScheduleStubs;