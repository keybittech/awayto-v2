import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';

import CreateIcon from '@mui/icons-material/Create';

import { IGroupUser, IActionTypes, IGroupRole } from 'awayto/core';
import { sh, useGrid } from 'awayto/hooks';

import ManageUserModal from './ManageUserModal';
import { useParams } from 'react-router';

export function ManageUsers(props: IProps): JSX.Element {
  
  const { groupName } = useParams();
  if (!groupName) return <></>;

  const { data: groupUsers } = sh.useGetGroupUsersQuery({ groupName });

  const [user, setUser] = useState<IGroupUser>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const actions = length == 1 ? [
      <IconButton key={'manage_user'} onClick={() => {
        setUser(groupUsers?.find(gu => gu.id === selected[0]));
        setDialog('manage_user');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...actions,
      // <IconButton key={'lock_user'} onClick={() => {
      //   api(lockUsersAction, { users: selected.map(u => ({ username: u.username })) }, { load: true });
      //   setToggle(!toggle);
      // }}><LockIcon /></IconButton>,
      // <IconButton key={'unlock_user'} onClick={() => {
      //   api(unlockUsersAction, { users: selected.map(u => ({ username: u.username })) }, { load: true });
      //   setToggle(!toggle);
      // }}><LockOpenIcon /></IconButton>,
    ];
  }, [selected]);

  const UserGrid = useGrid<IGroupUser>({
    rows: groupUsers || [],
    columns: [
      { flex: 1, headerName: 'Username', field: 'username' },
      { flex: 1, headerName: 'First Name', field: 'firstName' },
      { flex: 1, headerName: 'Last Name', field: 'lastName' },
      { flex: 1, headerName: 'Role', field: 'roleName' },
      { field: 'createdOn', headerName: 'Created', flex: 1, renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Users</Typography>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  return <>
    <Dialog open={dialog === 'manage_user'} fullWidth maxWidth="xs">
      <Suspense>
        <ManageUserModal {...props} editUser={user} closeModal={() => setDialog('')} />
      </Suspense>
    </Dialog>
    
    <UserGrid />
  </>
}

export default ManageUsers;