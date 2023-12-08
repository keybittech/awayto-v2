import React, { useState, useMemo, Suspense, useContext } from 'react';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { DataGrid } from '@mui/x-data-grid';

import { dayjs, plural } from 'awayto/core';
import { useGrid, useUtil, sh, useContexts, useComponents } from 'awayto/hooks';

// This is how group users interact with the schedule

export function ManageScheduleBrackets(): React.JSX.Element {

  const { ManageScheduleBracketsModal } = useComponents();
  const { setSnack, openConfirm } = useUtil();

  const {
    GroupSelect,
    groupSchedules,
  } = useContext(useContexts().GroupContext) as GroupContextType;

  const {
    getGroupSchedules: {
      refetch: refetchGroupSchedules
    },
    getGroupUserSchedules: {
      refetch: refetchGroupUserSchedules
    },
    getGroupUserScheduleStubs: {
      refetch: refetchGroupUserScheduleStubs
    },
  } = useContext(useContexts().GroupScheduleContext) as GroupScheduleContextType;


  const [deleteGroupUserScheduleByUserScheduleId] = sh.useDeleteGroupUserScheduleByUserScheduleIdMutation();
  const [deleteSchedule] = sh.useDeleteScheduleMutation()

  const [scheduleId, setScheduleId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const { data: schedules, refetch: getSchedules } = sh.useGetSchedulesQuery();
  const { data: scheduleDetails, refetch: getScheduleById } = sh.useGetScheduleByIdQuery({ id: scheduleId }, { skip: !scheduleId });

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_schedule'} onClick={() => {
        setScheduleId(selected[0]);
        setDialog('manage_schedule');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_schedule'} title="Delete"><IconButton onClick={() => {
        openConfirm({
          isConfirming: true,
          confirmEffect: `Remove ${plural(selected.length, 'schedule', 'schedules')}. This cannot be undone.`,
          confirmAction: async () => {
            const ids = selected.join(',');
            await deleteGroupUserScheduleByUserScheduleId({ ids }).unwrap();
            await deleteSchedule({ ids }).unwrap();

            void getSchedules();
            void refetchGroupSchedules().then(() => {
              void refetchGroupUserSchedules();
              void refetchGroupUserScheduleStubs();
            });
            
            setSnack({ snackType: 'success', snackOn: 'Successfully removed schedule records.' });
          }
        });
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected]);

  const scheduleBracketGridProps = useGrid({
    rows: schedules || [],
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <GroupSelect />
      <Box pt={2} sx={{ width: '100%' }}>
        <Typography variant="button">Schedules:</Typography>
        <Button key={'create_schedule_button'} onClick={() => {
          if (groupSchedules?.length) {
            setScheduleId('');
            setDialog('manage_schedule');
          } else {
            setSnack({ snackType: 'warning', snackOn: 'There are no available master schedules.' })
          }
        }}>Create</Button>
        {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
      </Box>
    </>
  })

  return <>
    <Dialog fullScreen open={dialog === 'manage_schedule' && (!scheduleId || scheduleDetails?.id === scheduleId)} fullWidth maxWidth="sm">
      <Suspense>
        <ManageScheduleBracketsModal editSchedule={scheduleId ? scheduleDetails : undefined} closeModal={() => {
          setDialog('');
          scheduleId && getScheduleById().catch(console.error);
          getSchedules().catch(console.error);
        }} />
      </Suspense>
    </Dialog>

    <DataGrid {...scheduleBracketGridProps} />
  </>
}

export default ManageScheduleBrackets;
