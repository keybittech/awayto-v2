import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import EventNoteIcon from '@mui/icons-material/EventNote';
import DeleteIcon from '@mui/icons-material/Delete';

import { ISchedule, IActionTypes, IGroupSchedule, IUtilActionTypes } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

import ManageSchedulesModal from './ManageSchedulesModal';
import { useParams } from 'react-router';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageSchedulesActions = {
  groupSchedules?: Record<string, IGroupSchedule>;
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

  const { groupName } = useParams();

  const act = useAct();
  const api = useApi();
  const util = useRedux(state => state.util);
  const [schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<ISchedule[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: ISchedule[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Name', selector: row => row.name },
    { name: 'Created', selector: row => row.createdOn }
  ] as TableColumn<ISchedule>[], [groupSchedules])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'view_schedule_details'} title="View Details">
        <IconButton key={'manage_schedule'} onClick={() => {
          setSchedule(selected.pop());
          setDialog('manage_schedule');
          setToggle(!toggle);
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
              message: 'Are you sure you want to delete these schedules? This cannot be undone.',
              action: () => {

                const [, res] = api(deleteGroupSchedulesAction, { groupName, ids: selected.map(s => s.id).join(',') }, { load: true })
                res?.then(() => {
                  setToggle(!toggle);
                  api(getGroupSchedulesAction, { groupName });
                }).catch(console.warn);
              }
            });
          }
        }}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    ]
  }, [selected, groupName])

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(getGroupSchedulesAction, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <ManageSchedulesModal {...props} editSchedule={schedule} closeModal={() => {
        setDialog('');
        api(getGroupSchedulesAction, { groupName });
      }} />
    </Dialog>

    <Card>
      <CardContent>
        <DataTable
          title="Schedule Templates"
          actions={<Button onClick={() => { setSchedule(undefined); setDialog('manage_schedule') }}>New</Button>}
          contextActions={actions}
          data={Object.values(groupSchedules)}
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
  </>
}

export default ManageSchedules;