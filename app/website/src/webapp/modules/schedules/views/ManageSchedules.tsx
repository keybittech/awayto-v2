import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreTimeIcon from '@mui/icons-material/MoreTime';

import { ISchedule, IActionTypes, IGroupSchedule, IUtilActionTypes } from 'awayto';
import { useApi, useAct, useComponents, useGrid } from 'awayto-hooks';

import ManageSchedulesModal from './ManageSchedulesModal';
import { useParams } from 'react-router';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageSchedulesActions = {
  groupSchedules?: Map<string, IGroupSchedule>;
  getGroupSchedulesAction?: IActionTypes;
  getGroupScheduleMasterByIdAction?: IActionTypes;
  postGroupSchedulesAction?: IActionTypes;
  putGroupSchedulesAction?: IActionTypes;
  deleteGroupSchedulesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageSchedulesActions { }
}

// This is how group owners interact with the schedule

export function ManageSchedules(props: IProps): JSX.Element {
  const { groupSchedules, getGroupSchedulesAction, deleteGroupSchedulesAction } = props as IProps & Required<ManageSchedulesActions>;

  const { ManageScheduleStubs } = useComponents();
  const { groupName } = useParams();

  const act = useAct();
  const api = useApi();
  const [schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(getGroupSchedulesAction, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_schedule'} title="Edit">
        <Button onClick={() => {
          setSchedule(groupSchedules.get(selected[0]));
          setDialog('manage_schedule');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_schedule'} title="Delete">
        <Button onClick={() => {
          if (groupName) {
            void act(OPEN_CONFIRM, {
              isConfirming: true,
              confirmEffect: 'Are you sure you want to delete these schedules? This cannot be undone.',
              confirmAction: () => {
                const [, res] = api(deleteGroupSchedulesAction, { groupName, ids: selected.join(',') }, { load: true })
                res?.then(() => {
                  api(getGroupSchedulesAction, { groupName });
                  setSelected([]);
                }).catch(console.warn);
              }
            });
          }
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
    ]
  }, [selected, groupName]);

  const ScheduleGrid = useGrid({
    rows: Array.from(groupSchedules.values()),
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
          <MoreTimeIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageSchedulesModal {...props} editSchedule={schedule} closeModal={() => {
          setDialog('');
          api(getGroupSchedulesAction, { groupName });
        }} />
      </Suspense>
    </Dialog>

    <Box mb={2}>
      <ScheduleGrid />
    </Box>

    <Box mb={2}>
      <ManageScheduleStubs {...props} />
    </Box>
  </>
}

export default ManageSchedules;