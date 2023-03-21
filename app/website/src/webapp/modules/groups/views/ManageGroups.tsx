import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import Logout from '@mui/icons-material/Logout';

import { IUtilActionTypes, IGroup, IActionTypes, IGroupActionTypes, IRole, SiteRoles } from 'awayto';
import { useRedux, useApi, useAct, useSecure, useGrid } from 'awayto-hooks';

import ManageGroupModal from './ManageGroupModal';
import JoinGroupModal from './JoinGroupModal';
import { useNavigate } from 'react-router';

import keycloak from '../../../keycloak';

const { OPEN_CONFIRM, SET_LOADING } = IUtilActionTypes;
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
  groups?: Map<string, IGroup>;
  roles?: Map<string, IRole>;
};

declare global {
  interface IProps extends ManageGroupsActions { }
}

export function ManageGroups(props: IProps): JSX.Element {
  const { getGroupsAction, deleteGroupsAction, groups } = props as Required<ManageGroupsActions>;

  const act = useAct();
  const api = useApi();
  const hasRole = useSecure();
  const navigate = useNavigate();
  const util = useRedux(state => state.util);
  const profile = useRedux(state => state.profile);
  const [group, setGroup] = useState<IGroup>();
  const [dialog, setDialog] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const actions = useMemo(() => {
    const { length } = selected;
    const gr = groups.get(selected[0]);
    const isOwner = gr?.createdSub === profile.sub;
    const acts = length == 1 ? [
      // <IconButton key={'groups_users_invite'} onClick={() => {
      //   setGroup(selected.pop());
      //   setDialog('groups_users_invite');
      //   setToggle(!toggle);
      // }}>
      //   <GroupAdd />
      // </IconButton>,
      gr && !isOwner && <Tooltip key={'leave_group'} title="Leave">
        <Button onClick={() => {
          void act(OPEN_CONFIRM, {
            isConfirming: true,
            confirmEffect: 'Leave the group ' + gr.name + ' and refresh the session.',
            confirmAction: () => {
              const [, res] = api(GROUPS_LEAVE, { code: gr.code }, { load: true });
              res?.then(() => {
                keycloak.clearToken();
              }).catch(console.warn);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Leave</Typography>
          <Logout sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>,
      gr && isOwner && hasRole([SiteRoles.APP_GROUP_ADMIN]) && <Tooltip key={'view_group_details'} title="Details">
        <Button onClick={() => {
          navigate(`/group/${gr.name}/manage/users`)
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Details</Typography>
          <ManageAccountsIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>,
      isOwner && <Tooltip key={'manage_group'} title="Edit">
        <Button onClick={() => {
          setGroup(groups.get(selected[0]));
          setDialog('manage_group');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      isOwner && <Tooltip key={'delete_group'} title="Delete">
        <Button onClick={() => {
          void act(OPEN_CONFIRM, {
            isConfirming: true,
            confirmEffect: 'Delete the group ' + gr.name + ' and refresh the session.',
            confirmAction: () => {
              const [, res] = api(deleteGroupsAction, { ids: selected.join(',') }, { load: true });
              res?.then(() => {
                keycloak.clearToken();
              }).catch(console.warn);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
    ];
  }, [selected]);

  const GroupsGrid = useGrid({
    rows: Array.from(groups.values()),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Code', field: 'code' },
      { flex: 1, headerName: 'Users', field: 'usersCount', renderCell: ({ row }) => row.usersCount || 0 },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: p => setSelected(p as string[]),
    toolbar: () => <>
      <Typography variant="button">Groups:</Typography>
      <Tooltip key={'join_group'} title="Join">
        <Button key={'join_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('join_group');
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Join</Typography>
          <DomainAddIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
      <Tooltip key={'create_group'} title="Create">
        <Button key={'create_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('create_group');
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <GroupAddIcon sx={{ display: { xs: 'flex', md: 'none' } }} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  useEffect(() => {
    if (Object.keys(groups || {}).length === 1 && Object.keys(profile.availableUserGroupRoles || {}).length && util.isLoading) {
      act(SET_LOADING, { isLoading: false, loadingMessage: '' });
    }
  }, [groups, profile.availableUserGroupRoles, util.isLoading]);

  useEffect(() => {
    const [abort, res] = api(getGroupsAction);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  return <>
    <Dialog open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          // api(getGroupsAction);
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

    <Dialog open={dialog === 'join_group'} fullWidth maxWidth="sm">
      <Suspense>
        <JoinGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    <Dialog open={dialog === 'manage_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    <GroupsGrid />

  </>
}

export default ManageGroups;