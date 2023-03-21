import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import EventNoteIcon from '@mui/icons-material/EventNote';
import DeleteIcon from '@mui/icons-material/Delete';

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
      <Tooltip key={'view_schedule_details'} title="View Details">
        <IconButton key={'manage_schedule'} onClick={() => {
          setSchedule(groupSchedules.get(selected[0]));
          setDialog('manage_schedule');
          setSelected([]);
        }}>
          <EventNoteIcon />
        </IconButton>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_schedule'} title="Delete">
        <IconButton onClick={() => {
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
          <DeleteIcon />
        </IconButton>
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
      <Button onClick={() => { setSchedule(undefined); setDialog('manage_schedule') }}>New</Button>
      {!!selected.length && <Box sx={{ float: 'right' }}>{actions}</Box>}
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