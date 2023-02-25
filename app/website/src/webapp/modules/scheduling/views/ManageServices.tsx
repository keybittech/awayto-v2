import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useParams } from 'react-router';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IService, IActionTypes, IGroupService, IUtilActionTypes } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

import ManageServiceModal from './ManageServiceModal';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageServicesActions = {
  services?: Record<string, IGroupService>;
  getServicesAction?: IActionTypes;
  postServicesAction?: IActionTypes;
  postGroupServicesAction?: IActionTypes;
  putServicesAction?: IActionTypes;
  disableServicesAction?: IActionTypes;
  deleteServicesAction?: IActionTypes;
  deleteGroupServicesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageServicesActions { }
}

export function ManageServices(props: IProps): JSX.Element {
  const { services, getServicesAction, deleteGroupServicesAction } = props as IProps & Required<ManageServicesActions>;

  const { groupName } = useParams();

  const act = useAct();
  const api = useApi();
  const util = useRedux(state => state.util);
  const [service, setService] = useState<IService>();
  const [selected, setSelected] = useState<IService[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: IService[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Name', selector: row => row.name },
    { name: 'Created', selector: row => row.createdOn }
  ] as TableColumn<IService>[], [services])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_service'} onClick={() => {
        setService(selected.pop());
        setDialog('manage_service');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_service'} title="Delete"><IconButton onClick={() => {
        if (groupName) {
          void act(OPEN_CONFIRM, {
            isConfirming: true,
            message: 'Are you sure you want to delete these services? This cannot be undone.',
            action: () => {
              const [, res] = api(deleteGroupServicesAction, { groupName, ids: selected.map(s => s.id).join(',') }, { load: true })
              res?.then(() => {
                setToggle(!toggle);
                api(getServicesAction, { groupName });
              });
            }
          });
        }
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected])

  useEffect(() => {
    if (groupName) {
      const [abort] = api(getServicesAction, { groupName });
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog scroll="paper" open={dialog === 'manage_service'} fullWidth maxWidth="sm">
      <ManageServiceModal {...props} editService={service} closeModal={() => {
        setDialog('')
        api(getServicesAction, { groupName });
      }} />
    </Dialog>
    <Card>
      <CardContent>
        <DataTable
          title="Services"
          actions={<Button onClick={() => { setService(undefined); setDialog('manage_service') }}>New</Button>}
          contextActions={actions}
          data={Object.values(services)}
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

export default ManageServices;