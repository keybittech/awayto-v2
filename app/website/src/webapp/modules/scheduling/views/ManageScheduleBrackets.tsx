import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IService, ISchedule, IActionTypes, localFromNow, IUtilActionTypes, IGroupSchedule } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

import ManageScheduleBracketsModal from './ManageScheduleBracketsModal';
import { useParams } from 'react-router';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageScheduleBracketsActions = {
  schedules?: Record<string, ISchedule>;
  groupServices?: Record<string, IService>;
  groupSchedules?: Record<string, IGroupSchedule>;
  postScheduleAction?: IActionTypes;
  postScheduleParentAction?: IActionTypes;
  getScheduleBracketsAction?: IActionTypes;
  postScheduleBracketsAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageScheduleBracketsActions { }
}

// This is how group users interact with the schedule

export function ManageScheduleBrackets(props: IProps): JSX.Element {
  const { schedules, getScheduleBracketsAction } = props as IProps & Required<ManageScheduleBracketsActions>;

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
    { name: 'Created', selector: row => localFromNow(row.createdOn) }
  ] as TableColumn<ISchedule>[], [schedules])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_ScheduleBracket'} onClick={() => {
        setSchedule(selected.pop());
        setDialog('manage_ScheduleBracket');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      // <Tooltip key={'delete_schedule'} title="Delete"><IconButton onClick={() => {
      //   if (groupName) {

      //     void act(OPEN_CONFIRM, {
      //       isConfirming: true,
      //       message: 'Are you sure you want to delete these brackets? This cannot be undone.',
      //       action: () => {

      //         const [, res] = api(deleteScheduleBracketsAction, true, { groupName, ids: selected.map(s => s.id).join(',') })
      //         res?.then(() => {
      //           setToggle(!toggle);
      //           api(getScheduleBracketsAction, true, { groupName });
      //         });
      //       }
      //     });
      //   }
      // }}>
      //   <DeleteIcon />
      // </IconButton></Tooltip>
    ]
  }, [selected, groupName])

  useEffect(() => {
    if (groupName) {
      const [abort] = api(getScheduleBracketsAction, true, { groupName });
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <ManageScheduleBracketsModal {...props} editSchedule={schedule} closeModal={() => {
        setDialog('')
        api(getScheduleBracketsAction, true, { groupName });
      }} />
    </Dialog>

    <DataTable
      title="ScheduleBrackets"
      actions={<Button onClick={() => { setSchedule(undefined); setDialog('manage_schedule') }}>New</Button>}
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

export default ManageScheduleBrackets;