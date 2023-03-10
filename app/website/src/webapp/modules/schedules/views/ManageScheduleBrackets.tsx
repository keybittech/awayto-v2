import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IService, ISchedule, IActionTypes, IGroupSchedule, IGroup, IUtilActionTypes, plural } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

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

// This is how group users interact with the schedule

export function ManageScheduleBrackets(props: IProps): JSX.Element {
  const { getGroupServicesAction, getGroupSchedulesAction, schedules, getScheduleBracketsAction, deleteScheduleAction, deleteGroupUserScheduleByUserScheduleIdAction } = props as IProps & Required<ManageScheduleBracketsActions>;

  const api = useApi();
  const act = useAct();
  const util = useRedux(state => state.util);
  const [schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<ISchedule[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');
  const { groups } = useRedux(state => state.profile);
  const [group, setGroup] = useState({ id: '' } as IGroup);

  if (!groups) return <></>;

  useEffect(() => {
    if (groups) {
      for (const g in groups) {
        setGroup(groups[g]);
        break;
      }
    }
  }, [groups]);

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

  const updateState = useCallback((state: { selectedRows: ISchedule[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Name', selector: row => row.name },
    { name: 'Created', selector: row => row.createdOn },
    // TODO make a column that summarizes the bracket load
  ] as TableColumn<ISchedule>[], []);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_schedule'} onClick={() => {
        setSchedule(selected.pop());
        setDialog('manage_schedule');
        setToggle(!toggle);
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
              const ids = selected.map(s => s.id).join(',');
              const [, res] = api(deleteGroupUserScheduleByUserScheduleIdAction, { groupName: group.name, ids })
              res?.then(() => {
                const [, rez] = api(deleteScheduleAction, { ids });
                rez?.then(() => {
                  act(SET_SNACK, { snackType: 'success', snackOn: 'Successfully removed schedule records.'})
                  setToggle(!toggle);
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

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <ManageScheduleBracketsModal {...props} group={group} editSchedule={schedule} closeModal={() => {
        setDialog('')
        // api(getScheduleBracketsAction);
      }} />
    </Dialog>

    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            setSchedule(undefined);
            setDialog('manage_schedule');
          }}>
            <Box m={2} sx={{ display: 'flex' }}>
              <Typography color="secondary" variant="button">
                Create Schedule
              </Typography>
            </Box>
          </CardActionArea>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>

            <DataTable
              title="Schedules"
              actions={[
                <Box key={'schedule_bracket_group_select'}>
                  <TextField
                    select
                    fullWidth
                    value={group.id}
                    label="Group"
                    variant="standard"
                    onChange={e => {
                      setGroup(groups[e.target.value]);
                    }}
                  >
                    {Object.values(groups).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
                  </TextField>
                </Box>
              ]}
              contextActions={actions}
              data={Object.values(schedules)}
              defaultSortFieldId="createdOn"
              defaultSortAsc={false}
              theme={util.theme}
              columns={columns}
              selectableRows
              selectableRowsHighlight={true}
              // selectableRowsComponent={<Checkbox />}
              onSelectedRowsChange={updateState}
              clearSelectedRows={toggle}
              pagination={true}
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 25]}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </>
}

export default ManageScheduleBrackets;