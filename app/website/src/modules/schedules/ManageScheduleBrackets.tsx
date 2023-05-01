import React, { useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { DataGrid } from '@mui/x-data-grid';

import { ISchedule, IGroup, plural } from 'awayto/core';
import { useGrid, useUtil, sh } from 'awayto/hooks';

import ManageScheduleBracketsModal from './ManageScheduleBracketsModal';

// This is how group users interact with the schedule

export function ManageScheduleBrackets(props: IProps): JSX.Element {

  const { setSnack, openConfirm } = useUtil();

  const [deleteGroupUserScheduleByUserScheduleId] = sh.useDeleteGroupUserScheduleByUserScheduleIdMutation();
  const [deleteSchedule] = sh.useDeleteScheduleMutation()

  const [schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');
  const [group, setGroup] = useState({ id: '' } as IGroup);

  const { data: profile, isSuccess: profileLoaded, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();
  if (!profileLoaded) return <></>;

  const groupsValues = useMemo(() => Object.values(profile?.groups || {}), [profile]);

  const { data: schedules, refetch: getSchedules } = sh.useGetSchedulesQuery();
  const { data: groupSchedules } = sh.useGetGroupSchedulesQuery({ groupName: groupsValues[0].name }, { skip: !groupsValues.length });

  if (groupsValues.length && !group.id) {
    setGroup(groupsValues[0]);
  }

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_schedule'} onClick={() => {
        setSchedule(schedules?.find(s => s.id === selected[0]));
        setDialog('manage_schedule');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_schedule'} title="Delete"><IconButton onClick={() => {
        if (group.name) {
          openConfirm({
            isConfirming: true,
            confirmEffect: `Remove ${plural(selected.length, 'schedule', 'schedules')}. This cannot be undone.`,
            confirmAction: async () => {
              const ids = selected.join(',');
              await deleteGroupUserScheduleByUserScheduleId({ groupName: group.name, ids }).unwrap();
              await deleteSchedule({ ids }).unwrap();
              void getUserProfileDetails();
              setSnack({ snackType: 'success', snackOn: 'Successfully removed schedule records.' });
            }
          });
        }
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected, group]);

  const scheduleBracketGridProps = useGrid({
    rows: schedules || [],
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <TextField
        select
        value={group.id}
        label="Group"
        variant="standard"
        onChange={e => {
          if (profile?.groups) {
            const gr = profile?.groups[e.target.value];
            if (gr) setGroup(gr);
          }
        }}
      >
        {groupsValues.map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
      </TextField>
      <Box pt={2} sx={{ width: '100%' }}>
        <Typography variant="button">Schedules:</Typography>
        <Button key={'create_schedule_button'} onClick={() => {
          if (groupSchedules?.length) {
            setSchedule(undefined);
            setDialog('manage_schedule');
          } else {
            setSnack({ snackType: 'warning', snackOn: 'There are no active group schedules.' })
          }
        }}>Create</Button>
        {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
      </Box>
    </>
  })

  return <>
    <Dialog fullScreen open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageScheduleBracketsModal {...props} group={group} editSchedule={schedule} closeModal={() => {
          setDialog('');
          getSchedules().catch(console.error);
        }} />
      </Suspense>
    </Dialog>

    <DataGrid {...scheduleBracketGridProps} />
  </>
}

export default ManageScheduleBrackets;