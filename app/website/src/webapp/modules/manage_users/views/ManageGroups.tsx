import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAdd from '@mui/icons-material/GroupAdd';
import Logout from '@mui/icons-material/Logout';

import { IUtilActionTypes, IGroup, IActionTypes, IRoles, IGroups, IGroupActionTypes } from 'awayto';
import { useRedux, useApi, useAct } from 'awayto-hooks';

import ManageGroupModal from './ManageGroupModal';
import InviteUsersModal from './InviteUsersModal';
import JoinGroupModal from './JoinGroupModal';

const { OPEN_CONFIRM } = IUtilActionTypes;
const { GROUPS_LEAVE } = IGroupActionTypes;

export type ManageGroupsActions = {
  getGroupsAction?: IActionTypes;
  deleteGroupsAction?: IActionTypes;
  putGroupsAction?: IActionTypes;
  postGroupsAction?: IActionTypes;
  getRolesAction?: IActionTypes;
  checkNameAction?: IActionTypes;
  postRolesAction?: IActionTypes;
  deleteRolesAction?: IActionTypes;
  groups?: IGroups;
  roles?: IRoles;
};

declare global {
  interface IProps extends ManageGroupsActions { }
}

export function ManageGroups(props: IProps): JSX.Element {
  const { getGroupsAction, deleteGroupsAction, groups } = props as Required<ManageGroupsActions>;

  const act = useAct();
  const api = useApi();
  const util = useRedux(state => state.util);
  const profile = useRedux(state => state.profile);
  const [group, setGroup] = useState<IGroup>();
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');
  const [selected, setSelected] = useState<IGroup[]>([]);

  const updateState = useCallback((state: { selectedRows: IGroup[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name },
    { name: 'Code', selector: row => row.code },
    { name: 'Users', cell: (group: IGroup) => group.users || 0 },
    { name: 'Roles', cell: (group: IGroup) => group.roles ? group.roles.map(r => r.name).join(', ') : '' },
  ] as TableColumn<IGroup>[], undefined);

  const actions = useMemo(() => {
    const { length } = selected;
    const isOwner = selected[0]?.createdSub === profile.sub;
    const acts = length == 1 ? [
      // <IconButton key={'groups_users_invite'} onClick={() => {
      //   setGroup(selected.pop());
      //   setDialog('groups_users_invite');
      //   setToggle(!toggle);
      // }}>
      //   <GroupAdd />
      // </IconButton>,
      !isOwner && <Tooltip key={'groups_leave'} title="Leave"><IconButton onClick={() => {
        void act(OPEN_CONFIRM, {
          isConfirming: true,
          message: 'Are you sure you want to leave this group?',
          action: () => {
            api(GROUPS_LEAVE, true, { code: selected.pop()?.code });
            setToggle(!toggle);
          }
        });
      }}>
        <Logout />
      </IconButton></Tooltip>,
      isOwner && <Tooltip key={'groups_manage'} title="Manage"><IconButton onClick={() => {
        setGroup(selected.pop());
        setDialog('groups_manage');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton></Tooltip>
    ] : [];

    return [
      ...acts,
      isOwner && <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={async () => {
        const [, res] = api(deleteGroupsAction, true, { ids: selected.map(s => s.id).join(',') })
        await res;
        setToggle(!toggle);
        api(getGroupsAction, true);
      }}><DeleteIcon /></IconButton></Tooltip>
    ];
  }, [selected]);

  useEffect(() => {
    const [abort] = api(getGroupsAction);
    return () => abort();
  }, []);

  return <>
    <Dialog open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    {/* <Dialog open={dialog === 'groups_users_invite'} fullWidth maxWidth="sm">
      <Suspense>
        <InviteUsersModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
        }} />
      </Suspense>
    </Dialog> */}

    <Dialog open={dialog === 'groups_join'} fullWidth maxWidth="sm">
      <Suspense>
        <JoinGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          void api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    <Dialog open={dialog === 'groups_manage'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          void api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>



    <DataTable
      title="Groups"
      actions={[
        <Button key={'join_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('groups_join');
        }}>Join</Button>,
        <Button key={'create_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('create_group');
        }}>Create</Button>
      ]}
      contextActions={actions}
      data={groups ? Object.values(groups) : []}
      theme={util.theme}
      columns={columns}
      selectableRows
      selectableRowsSingle
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

export default ManageGroups;