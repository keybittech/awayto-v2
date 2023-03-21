import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IRole, IActionTypes } from 'awayto';
import { useApi, useGrid } from 'awayto-hooks';

import ManageRoleModal from './ManageRoleModal';

export type ManageRolesActions = {
  roles?: Map<string, IRole>;
  getRolesAction?: IActionTypes;
  putRolesAction?: IActionTypes;
  postRolesAction?: IActionTypes;
  deleteRolesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageRolesActions { }
}

export function ManageRoles(props: IProps): JSX.Element {
  const { roles, getRolesAction, deleteRolesAction } = props as IProps & Required<ManageRolesActions>;

  const api = useApi();
  const [role, setRole] = useState<IRole>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_role'} onClick={() => {
        setRole(roles.get(selected[0]));
        setDialog('manage_role');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={() => {
        const [, res] = api(deleteRolesAction, { ids: selected.join(',') }, { load: true })
        res?.then(() => {
          api(getRolesAction);
          setSelected([]);
        }).catch(console.warn);
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected]);

  useEffect(() => {
    const [abort, res] = api(getRolesAction);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  const RoleGrid = useGrid({
    rows: Array.from(roles.values()),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={() => { setRole(undefined); setDialog('manage_role') }}>New</Button>
      {!!selected.length && <Box sx={{ float: 'right' }}>{actions}</Box>}
    </>
  })

  return <>
    <Dialog open={dialog === 'manage_role'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageRoleModal {...props} editRole={role} closeModal={() => {
          setDialog('')
          api(getRolesAction);
        }} />
      </Suspense>
    </Dialog>

    <RoleGrid />
  </>
}

export default ManageRoles;