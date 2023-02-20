import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn }  from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import CreateIcon from '@mui/icons-material/Create';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { IManageUsersActionTypes, IUserProfile, IActionTypes, IUsers, localFromNow } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageUserModal from './ManageUserModal';

const { LOCK_MANAGE_USERS, UNLOCK_MANAGE_USERS, GET_MANAGE_USERS } = IManageUsersActionTypes;

export type ManageUsersProps = {
  getAction?: IActionTypes;
  deleteAction?: IActionTypes;
  putAction?: IActionTypes;
  postAction?: IActionTypes;
  users?: IUsers;
};

declare global {
  interface IProps extends ManageUsersProps { }
}

export function ManageUsers(props: IProps): JSX.Element {
  const { users, getAction } = props as IProps & Required<ManageUsersProps>;
  const api = useApi();
  const util = useRedux(state => state.util);
  const [user, setUser] = useState<IUserProfile>();
  const [selected, setSelected] = useState<IUserProfile[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateSelections = useCallback((state: { selectedRows: IUserProfile[] }) => setSelected(state.selectedRows), []);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: '', grow: 'unset', minWidth: '48px', cell: (user: IUserProfile) => user.locked ? <LockIcon /> : <LockOpenIcon /> },
    { name: 'Username', selector: row => row.username },
    { name: 'First Name', selector: row => row.firstName },
    { name: 'Last Name', selector: row => row.lastName },
    { name: 'Group', selector: (user: IUserProfile) => user.groups ? user.groups.map(r => r.name).join(', ') : '' },
    { name: 'Created', selector: (user: IUserProfile) => localFromNow(user.createdOn) },
  ] as TableColumn<IUserProfile>[], undefined)

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
        api(LOCK_MANAGE_USERS, true, { users: selected.map(u => ({ username: u.username })) });
        setToggle(!toggle);
      }}><LockIcon /></IconButton>,
      <IconButton key={'unlock_user'} onClick={() => {
        api(UNLOCK_MANAGE_USERS, true, { users: selected.map(u => ({ username: u.username })) });
        setToggle(!toggle);
      }}><LockOpenIcon /></IconButton>,
    ];
  }, [selected])

  useEffect(() => {
    const [abort] = api(getAction, true);
    return () => abort();
  }, []);

  // When we update a user's profile, this will refresh their state in the table once the API has updated manageUsers redux state
  useEffect(() => {
    if (users?.length && user) setUser(users[user.id]);
  }, [users]);

  return <>

    <Dialog open={dialog === 'manage_user'} fullWidth maxWidth="lg">
      <ManageUserModal {...props} editUser={user} closeModal={() => setDialog('')} />
    </Dialog>

    <DataTable
      title="Users"
      actions={<Button onClick={() => { setUser(undefined); setDialog('manage_user') }}>New</Button>}
      contextActions={actions}
      data={users ? Object.values(users) : []}
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
  </>
}

export default ManageUsers;