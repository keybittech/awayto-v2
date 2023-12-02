import React, { useState, useMemo, Suspense } from 'react';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreTimeIcon from '@mui/icons-material/MoreTime';

import { DataGrid } from '@mui/x-data-grid';

import { dayjs, IGroupSchedule } from 'awayto/core';
import { useComponents, useGrid, sh, useUtil, useStyles } from 'awayto/hooks';

import ManageSchedulesModal from './ManageSchedulesModal';

// This is how group owners interact with the schedule
export function ManageSchedules(props: IProps): React.JSX.Element {
  const classes = useStyles();

  const { openConfirm } = useUtil();
  const { ManageScheduleStubs } = useComponents();

  const [deleteGroupSchedule] = sh.useDeleteGroupScheduleMutation();
  
  const { data: groupSchedules, refetch: getGroupSchedules } = sh.useGetGroupSchedulesQuery();

  const [schedule, setSchedule] = useState<IGroupSchedule>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_schedule'} title="Edit">
        <Button onClick={() => {
          setSchedule(groupSchedules?.find(gs => gs.id === selected[0]));
          setDialog('manage_schedule');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_schedule'} title="Delete">
        <Button onClick={() => {
          openConfirm({
            isConfirming: true,
            confirmEffect: 'Are you sure you want to delete these schedules? This cannot be undone.',
            confirmAction: async () => {
              await deleteGroupSchedule({ ids: selected.join(',') }).unwrap();
              void getGroupSchedules();
              setSelected([]);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  const scheduleGridProps = useGrid({
    rows: groupSchedules || [],
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Master Schedules:</Typography>
      <Tooltip key={'manage_role'} title="Create">
        <Button onClick={() => {
          setSchedule(undefined);
          setDialog('manage_schedule')
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <MoreTimeIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageSchedulesModal {...props} editGroupSchedule={schedule} closeModal={() => {
          setDialog('');
          void getGroupSchedules();
        }} />
      </Suspense>
    </Dialog>

    <Box mb={2}>
      <DataGrid {...scheduleGridProps} />
    </Box>

    <Box mb={2}>
      <ManageScheduleStubs {...props} />
    </Box>
  </>
}

export default ManageSchedules;
