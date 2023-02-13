import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IRole, IActionTypes, IRoles } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageRoleModal from './ManageRoleModal';

export type ManageRolesActions = {
  getRolesAction?: IActionTypes;
  putRolesAction?: IActionTypes;
  postRolesAction?: IActionTypes;
  deleteRolesAction?: IActionTypes;
  roles?: IRoles;
};

declare global {
  interface IProps extends ManageRolesActions { }
}

export function ManageRoles (props: IProps): JSX.Element {
  const { roles, getRolesAction, deleteRolesAction } = props as IProps & Required<ManageRolesActions>;

  const api = useApi();
  const util = useRedux(state => state.util);
  const [role, setRole] = useState<IRole>();
  const [selected, setSelected] = useState<IRole[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: IRole[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name }
  ] as TableColumn<IRole>[], [])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_role'} onClick={() => {
        setRole(selected.pop());
        setDialog('manage_role');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={async () => {
        const [, res] = api(deleteRolesAction, true, { ids: selected.map(s => s.id).join(',') })
        await res;
        setToggle(!toggle);
        api(getRolesAction, true);
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected])

  useEffect(() => {
    const [abort] = api(getRolesAction, true);
    return () => abort();
  }, []);

  return <>
    <Dialog open={dialog === 'manage_role'} fullWidth maxWidth="sm">
      <ManageRoleModal {...props} editRole={role} closeModal={() => {
        setDialog('')
        api(getRolesAction);
      }} />
    </Dialog>

    <DataTable
      title="Roles"
      actions={<Button onClick={() => { setRole(undefined); setDialog('manage_role') }}>New</Button>}
      contextActions={actions}
      data={roles ? Object.values(roles) : []}
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

export default ManageRoles;