import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete';

import { IRole, IActionTypes } from 'awayto/core';
import { useApi, useGrid } from 'awayto/hooks';

import ManageRoleModal from './ManageRoleModal';

export type ManageRolesActions = {
  roles?: Record<string, IRole>;
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
      <Tooltip key={'manage_role'} title="Edit">
        <Button onClick={() => {
          setRole(roles[selected[0]]);
          setDialog('manage_role');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_role'} title="Delete">
        <Button onClick={() => {
        const [, res] = api(deleteRolesAction, { ids: selected.join(',') }, { load: true })
        res?.then(() => {
          api(getRolesAction);
          setSelected([]);
        }).catch(console.warn);
      }}>
        <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
        <DeleteIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
      </Button>
      </Tooltip>
    ]
  }, [selected]);

  useEffect(() => {
    const [abort, res] = api(getRolesAction);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  const RoleGrid = useGrid({
    rows: Object.values(roles),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Roles:</Typography>
      <Tooltip key={'manage_role'} title="Create">
        <Button onClick={() => {
          setRole(undefined);
          setDialog('manage_role')
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <GroupAddIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
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