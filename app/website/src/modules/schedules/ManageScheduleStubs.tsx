import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams } from 'react-router';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';

import { IGroupUserScheduleStub, shortNSweet } from 'awayto/core';
import { useGrid, sh } from 'awayto/hooks';

import ManageScheduleStubModal from './ManageScheduleStubModal';

export function ManageSchedules(props: IProps): JSX.Element {

  const { groupName } = useParams();
  if (!groupName) return <></>;

  const { data: schedules, refetch: getGroupUserScheduleStubs } = sh.useGetGroupUserScheduleStubsQuery({ groupName })
  if (!schedules) return <></>;

  const { stubs } = schedules;

  const [stub, setStub] = useState<IGroupUserScheduleStub>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    return length == 1 ? [
      <Tooltip key={'view_schedule_details'} title="View Details">
        <IconButton key={'manage_schedule'} onClick={() => {
          if (stubs?.length) {
            setStub(stubs?.find(s => s.userScheduleId === selected[0]));
            setDialog('manage_schedule');
            setSelected([]);
          }
        }}>
          <CreateIcon />
        </IconButton>
      </Tooltip>
    ] : []
  }, [selected, groupName]);

  const ScheduleStubGrid = useGrid({
    rows: stubs || [],
    columns: [
      { flex: 1, headerName: 'Date', field: 'slotDate', renderCell: ({ row }) => shortNSweet(row.slotDate, row.startTime) },
      { flex: 1, headerName: 'Service', field: 'serviceName' },
      { flex: 1, headerName: 'Tier', field: 'tierName' },
      { flex: 1, headerName: 'Created', field: 'replacement', renderCell: ({ row }) => Object.keys(row.replacement || {}).length ? 'Yes' : 'No' }
    ],
    rowId: 'userScheduleId',
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Appointment Issues</Typography>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageScheduleStubModal {...props} editGroupUserScheduleStub={stub} closeModal={() => {
          setDialog('');
          void getGroupUserScheduleStubs();
        }} />
      </Suspense>
    </Dialog>

    <ScheduleStubGrid />
  </>
}

export default ManageSchedules;