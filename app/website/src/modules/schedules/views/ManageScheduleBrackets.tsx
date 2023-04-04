import React, { useState, useMemo, useEffect, Suspense } from 'react';
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

import { IService, ISchedule, IActionTypes, IGroupSchedule, IGroup, IUtilActionTypes, IUserProfileActionTypes, plural } from 'awayto/core';
import { storeApi, useApi, useAct, useGrid } from 'awayto/hooks';

import ManageScheduleBracketsModal from './ManageScheduleBracketsModal';

export type ManageScheduleBracketsActions = {
  schedules?: Record<string, ISchedule>;
  groupServices?: Record<string, IService>;
  groupSchedules?: Record<string, IGroupSchedule>;
  getScheduleByIdAction?: IActionTypes;
  getGroupServicesAction?: IActionTypes;
  getGroupSchedulesAction?: IActionTypes;
  postScheduleAction?: IActionTypes;
  deleteScheduleAction?: IActionTypes;
  deleteGroupUserScheduleByUserScheduleIdAction?: IActionTypes;
  postGroupUserScheduleAction?: IActionTypes;
  getScheduleBracketsAction?: IActionTypes;
  postScheduleBracketsAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageScheduleBracketsActions { }
}

const { OPEN_CONFIRM, SET_SNACK } = IUtilActionTypes;
const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;

// This is how group users interact with the schedule

export function ManageScheduleBrackets(props: IProps): JSX.Element {
  const { getGroupServicesAction, getGroupSchedulesAction, schedules, getScheduleBracketsAction, deleteScheduleAction, deleteGroupUserScheduleByUserScheduleIdAction } = props as IProps & Required<ManageScheduleBracketsActions>;

  const api = useApi();
  const act = useAct();
  const [schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');
  const [group, setGroup] = useState({ id: '' } as IGroup);

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);

  if (groupsValues.length && !group.id) {
    setGroup(groupsValues[0]);
  }

  useEffect(() => {
    const [abort, res] = api(getScheduleBracketsAction);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  useEffect(() => {
    if (group.name) {
      const [abort1] = api(getGroupSchedulesAction, { groupName: group.name });
      const [abort2] = api(getGroupServicesAction, { groupName: group.name });
      return () => {
        abort1();
        abort2();
      }
    }
  }, [group]);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_schedule'} onClick={() => {
        setSchedule(schedules[selected[0]]);
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
          void act(OPEN_CONFIRM, {
            isConfirming: true,
            confirmEffect: `Remove ${plural(selected.length, 'schedule', 'schedules')}. This cannot be undone.`,
            confirmAction: () => {
              const ids = selected.join(',');
              const [, res] = api(deleteGroupUserScheduleByUserScheduleIdAction, { groupName: group.name, ids })
              res?.then(() => {
                const [, rez] = api(deleteScheduleAction, { ids });
                rez?.then(() => {
                  api(GET_USER_PROFILE_DETAILS);
                  act(SET_SNACK, { snackType: 'success', snackOn: 'Successfully removed schedule records.'})
                })
              }).catch(console.warn);
            }
          });
        }
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected, group]);

  const ScheduleBracketGrid = useGrid({
    rows: Object.values(schedules),
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
          const gr = profile.groups[e.target.value];
          if (gr) setGroup(gr);
        }}
      >
        {groupsValues.map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
      </TextField>
      <Box pt={2} sx={{ width: '100%' }}>
        <Typography variant="button">Schedules:</Typography>
        <Button key={'join_group_button'} onClick={() => {
          if (schedules.size) {
            setSchedule(undefined);
            setDialog('manage_schedule');
          } else {
            act(SET_SNACK, { snackType: 'warning', snackOn: 'There are no active group schedules.' })
          }
        }}>Create</Button>
        {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
      </Box>
    </>
  })

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageScheduleBracketsModal {...props} group={group} editSchedule={schedule} closeModal={() => {
          setDialog('');
        }} />
      </Suspense>
    </Dialog>

    <ScheduleBracketGrid />
  </>
}

export default ManageScheduleBrackets;