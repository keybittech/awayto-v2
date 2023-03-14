import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useParams } from 'react-router';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';

import { IGroupUserScheduleActionTypes, IGroupUserScheduleStub, shortNSweet } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageScheduleStubModal from './ManageScheduleStubModal';

const { GET_GROUP_USER_SCHEDULE_STUBS } = IGroupUserScheduleActionTypes;

export function ManageSchedules(props: IProps): JSX.Element {

  const { groupName } = useParams();

  const api = useApi();
  const { stubs } = useRedux(state => state.groupUserSchedule);

  const util = useRedux(state => state.util);
  const [stub, setStub] = useState<IGroupUserScheduleStub>();
  const [selected, setSelected] = useState<IGroupUserScheduleStub[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: IGroupUserScheduleStub[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'slotDate', name: 'Date', selector: row => shortNSweet(row.slotDate, row.startTime) },
    { name: 'Service', selector: row => row.serviceName },
    { name: 'Tier', selector: row => row.tierName },
    { name: 'Replacement', selector: row => Object.keys(row.replacement || {}).length ? 'Yes' : 'No' },
  ] as TableColumn<IGroupUserScheduleStub>[], []);

  const actions = useMemo(() => {
    const { length } = selected;
    return length == 1 ? [
      <Tooltip key={'view_schedule_details'} title="View Details">
        <IconButton key={'manage_schedule'} onClick={() => {
          setStub(selected.pop());
          setDialog('manage_schedule');
          setToggle(!toggle);
        }}>
          <CreateIcon />
        </IconButton>
      </Tooltip>
    ] : []
  }, [selected, groupName]);

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(GET_GROUP_USER_SCHEDULE_STUBS, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog open={dialog === 'manage_schedule'} fullWidth maxWidth="sm">
      <ManageScheduleStubModal {...props} editGroupUserScheduleStub={stub} closeModal={() => {
        setDialog('');
        api(GET_GROUP_USER_SCHEDULE_STUBS, { groupName });
      }} />
    </Dialog>

    <Card>
      <CardContent>
        <DataTable
          title="Schedule Stubs"
          actions={<Button onClick={() => { setStub(undefined); setDialog('manage_schedule') }}>New</Button>}
          contextActions={actions}
          data={stubs}
          defaultSortFieldId="slotDate"
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