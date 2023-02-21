import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { ISchedule, IActionTypes, localFromNow, IGroupSchedule, IUtilActionTypes } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

import ManageScheduleModal from './ ManageScheduleModal';
import { useParams } from 'react-router';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageSchedulesActions = {
  schedules?: Record<string, IGroupSchedule>;
  getSchedulesAction?: IActionTypes;
  postSchedulesAction?: IActionTypes;
  postGroupSchedulesAction?: IActionTypes;
  putSchedulesAction?: IActionTypes;
  disableSchedulesAction?: IActionTypes;
  deleteSchedulesAction?: IActionTypes;
  deleteGroupSchedulesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageSchedulesActions { }
}

export function ManageSchedules(props: IProps): JSX.Element {
  const { schedules, getSchedulesAction, deleteGroupSchedulesAction } = props as IProps & Required<ManageSchedulesActions>;

  const { groupName } = useParams();

  const act = useAct();
  const api = useApi();
  const util = useRedux(state => state.util);
  const [Schedule, setSchedule] = useState<ISchedule>();
  const [selected, setSelected] = useState<ISchedule[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: ISchedule[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Name', selector: row => row.name },
    { name: 'Created', selector: row => localFromNow(row.createdOn) }
  ] as TableColumn<ISchedule>[], [schedules])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_Schedule'} onClick={() => {
        setSchedule(selected.pop());
        setDialog('manage_Schedule');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_Schedule'} title="Delete"><IconButton onClick={() => {
        if (groupName) {

          void act(OPEN_CONFIRM, {
            isConfirming: true,
            message: 'Are you sure you want to delete these schedules? This cannot be undone.',
            action: () => {

              const [, res] = api(deleteGroupSchedulesAction, true, { groupName, ids: selected.map(s => s.id).join(',') })
              res?.then(() => {
                setToggle(!toggle);
                api(getSchedulesAction, true, { groupName });
              });
            }
          });
        }
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected, groupName])

  useEffect(() => {
    if (groupName) {
      const [abort] = api(getSchedulesAction, true, { groupName });
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog open={dialog === 'manage_Schedule'} fullWidth maxWidth="sm">
      <ManageScheduleModal {...props} editSchedule={Schedule} closeModal={() => {
        setDialog('')
        api(getSchedulesAction, true, { groupName });
      }} />
    </Dialog>

    <DataTable
      title="Schedules"
      actions={<Button onClick={() => { setSchedule(undefined); setDialog('manage_Schedule') }}>New</Button>}
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
  </>
}

export default ManageSchedules;