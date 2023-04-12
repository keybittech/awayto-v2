import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';

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

import { IGroup, IUserProfile, SiteRoles } from 'awayto/core';
import { useAppSelector, useSecure, useGrid, sh, useUtil } from 'awayto/hooks';

import ManageGroupModal from './ManageGroupModal';
import JoinGroupModal from './JoinGroupModal';

import keycloak from '../../keycloak';

export function ManageGroups(props: IProps): JSX.Element {
  const [deleteGroup] = sh.useDeleteGroupMutation();
  const [leaveGroup] = sh.useLeaveGroupMutation();

  const { openConfirm, setLoading } = useUtil();

  const hasRole = useSecure();
  const navigate = useNavigate();
  const util = useAppSelector(state => state.util);

  const [group, setGroup] = useState<IGroup>();
  const [dialog, setDialog] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();

  const { groups } = profile || {};

  const actions = useMemo(() => {
    if (!groups) return [];
    const { length } = selected;
    const gr = groups[selected[0]];
    const isOwner = gr?.createdSub === profile?.sub;
    const acts = length == 1 ? [
      gr && !isOwner && <Tooltip key={'leave_group'} title="Leave">
        <Button onClick={() => {
          openConfirm({
            isConfirming: true,
            confirmEffect: 'Leave the group ' + gr.name + ' and refresh the session.',
            confirmAction: () => {
              leaveGroup({ code: gr.code }).unwrap().then(() => keycloak.clearToken()).catch(console.error);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Leave</Typography>
          <Logout sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>,
      gr && isOwner && hasRole([SiteRoles.APP_GROUP_ADMIN]) && <Tooltip key={'view_group_details'} title="Details">
        <Button onClick={() => {
          navigate(`/group/${gr.name}/manage/users`)
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Details</Typography>
          <ManageAccountsIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>,
      isOwner && <Tooltip key={'manage_group'} title="Edit">
        <Button onClick={() => {
          setGroup(groups[selected[0]]);
          setDialog('manage_group');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      isOwner && <Tooltip key={'delete_group'} title="Delete">
        <Button onClick={() => {
          openConfirm({
            isConfirming: true,
            confirmEffect: 'Delete the group ' + gr.name + ' and refresh the session.',
            confirmAction: () => {
              deleteGroup({ ids: selected.join(',') }).unwrap().then(() => keycloak.clearToken()).catch(console.error);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ];
  }, [selected, groups]);

  const GroupsGrid = useGrid({
    rows: Object.values(groups || {}),
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
          <DomainAddIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
      <Tooltip key={'create_group'} title="Create">
        <Button key={'create_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('create_group');
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <GroupAddIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  useEffect(() => {
    if (groups && Object.keys(groups).length === 1 && Object.keys(profile?.availableUserGroupRoles || {}).length && util.isLoading) {
      setLoading({ isLoading: false, loadingMessage: '' });
    }
  }, [groups, profile?.availableUserGroupRoles, util.isLoading]);

  return <>
    <Dialog open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          void getUserProfileDetails();
        }} />
      </Suspense>
    </Dialog>

    <Dialog open={dialog === 'join_group'} fullWidth maxWidth="sm">
      <Suspense>
        <JoinGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          void getUserProfileDetails();
        }} />
      </Suspense>
    </Dialog>

    <Dialog open={dialog === 'manage_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          void getUserProfileDetails();
        }} />
      </Suspense>
    </Dialog>

    <GroupsGrid />

  </>
}

export default ManageGroups;