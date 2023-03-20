import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import dayjs from 'dayjs';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';

import CreateIcon from '@mui/icons-material/Create';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { IGroupUser, IActionTypes, IGroupRole } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

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
  const { users, getUsersAction, lockUsersAction, unlockUsersAction } = props as IProps & Required<ManageUsersProps>;
  const { groupName } = useParams();
  
  const api = useApi();
  const util = useRedux(state => state.util);
  const [user, setUser] = useState<IGroupUser>();
  const [selected, setSelected] = useState<IGroupUser[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateSelections = useCallback((state: { selectedRows: IGroupUser[] }) => setSelected(state.selectedRows), []);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: '', grow: 'unset', minWidth: '48px', cell: (user: IGroupUser) => user.locked ? <LockIcon /> : <LockOpenIcon /> },
    { name: 'Username', selector: row => row.username },
    { name: 'First Name', selector: row => row.firstName },
    { name: 'Last Name', selector: row => row.lastName },
    { name: 'Role', selector: row => row.roleName },
    { name: 'Created', selector: (user: IGroupUser) => dayjs().to(dayjs.utc(user.createdOn)) },
  ] as TableColumn<IGroupUser>[], undefined)

  const actions = useMemo(() => {
    const { length } = selected;
    const actions = length == 1 ? [
      <IconButton key={'manage_user'} onClick={() => {
        setUser(selected.pop());
        setDialog('manage_user');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...actions,
      <IconButton key={'lock_user'} onClick={() => {
        api(lockUsersAction, { users: selected.map(u => ({ username: u.username })) }, { load: true });
        setToggle(!toggle);
      }}><LockIcon /></IconButton>,
      <IconButton key={'unlock_user'} onClick={() => {
        api(unlockUsersAction, { users: selected.map(u => ({ username: u.username })) }, { load: true });
        setToggle(!toggle);
      }}><LockOpenIcon /></IconButton>,
    ];
  }, [selected])

  useEffect(() => {
    const [abort, res] = api(getUsersAction, { groupName });
    res?.catch(console.warn);
    return () => abort();
  }, []);

  // When we update a user's profile, this will refresh their state in the table once the API has updated manageUsers redux state
  useEffect(() => {
    if (users.size && user) setUser(users.get(user.id));
  }, [users, user]);

  return <>

    <Dialog open={dialog === 'manage_user'} fullWidth maxWidth="xs">
      <ManageUserModal {...props} editUser={user} closeModal={() => setDialog('')} />
    </Dialog>
    <Card>
      <CardContent>
        <DataTable
          title="Users"
          // actions={<Button onClick={() => { setUser(undefined); setDialog('manage_user') }}>New</Button>}
          contextActions={actions}
          data={Array.from(users.values())}
          theme={util.theme}
          columns={columns}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          selectableRows
          selectableRowsHighlight={true}
          // selectableRowsComponent={<><Checkbox /></>}
          onSelectedRowsChange={updateSelections}
          clearSelectedRows={toggle}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </>
}

export default ManageUsers;