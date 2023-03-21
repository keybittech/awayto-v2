import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';

import CreateIcon from '@mui/icons-material/Create';

import { IGroupUser, IActionTypes, IGroupRole } from 'awayto';
import { useApi, useGrid } from 'awayto-hooks';

import ManageUserModal from './ManageUserModal';
import { useParams } from 'react-router';

export type ManageUsersProps = {
  users?: Map<string, IGroupUser>;
  groupRoles?: Map<string, IGroupRole>;
  getUsersAction?: IActionTypes;
  getUserByIdAction?: IActionTypes;
  deleteUsersAction?: IActionTypes;
  putUsersAction?: IActionTypes;
  postUsersAction?: IActionTypes;
  lockUsersAction?: IActionTypes;
  unlockUsersAction?: IActionTypes;
  getRolesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageUsersProps { }
}

export function ManageUsers(props: IProps): JSX.Element {
  const { users, getUsersAction } = props as IProps & Required<ManageUsersProps>;
  const { groupName } = useParams();
  
  const api = useApi();
  const [user, setUser] = useState<IGroupUser>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  useEffect(() => {
    const [abort, res] = api(getUsersAction, { groupName });
    res?.catch(console.warn);
    return () => abort();
  }, []);

  const actions = useMemo(() => {
    const { length } = selected;
    const actions = length == 1 ? [
      <IconButton key={'manage_user'} onClick={() => {
        setUser(users.get(selected[0]));
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
    rows: Array.from(users.values()),
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

  // When we update a user's profile, this will refresh their state in the table once the API has updated manageUsers redux state
  useEffect(() => {
    if (users.size && user) setUser(users.get(user.id));
  }, [users, user]);

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