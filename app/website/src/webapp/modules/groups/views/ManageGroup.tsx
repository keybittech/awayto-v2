import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { IRoleActionTypes, IUserActionTypes, IUserProfileActionTypes, IGroupServiceActionTypes, IGroupScheduleActionTypes, IServiceActionTypes, IScheduleActionTypes, SiteRoles } from 'awayto';
import { useComponents, useRedux } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_USERS } = IUserActionTypes;
const { PUT_ROLES, POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { POST_SERVICE, PUT_SERVICE, DELETE_SERVICE, DISABLE_SERVICE } = IServiceActionTypes;
const { POST_SCHEDULE, PUT_SCHEDULE, DELETE_SCHEDULE, DISABLE_SCHEDULE } = IScheduleActionTypes;
const { GET_GROUP_SERVICES, POST_GROUP_SERVICE, DELETE_GROUP_SERVICE } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES, POST_GROUP_SCHEDULE, DELETE_GROUP_SCHEDULE } = IGroupScheduleActionTypes;


declare global {
  interface IProps {
    view?: string;
  }
}

export function ManageGroup(props: IProps): JSX.Element {
  const { groupName, component } = useParams();

  const navigate = useNavigate();

  const user = useRedux(state => state.profile);
  const { users } = useRedux(state => state.user);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);

  const { ManageUsers, ManageRoles, ManageRoleActions, ManageServices, ManageSchedules, GroupSecure } = useComponents();

  const menuRoles: Record<string, SiteRoles[]> = {
    users: [SiteRoles.APP_GROUP_USERS],
    roles: [SiteRoles.APP_GROUP_ROLES],
    matrix: [SiteRoles.APP_GROUP_ADMIN],
    services: [SiteRoles.APP_GROUP_SERVICES],
    schedules: [SiteRoles.APP_GROUP_SCHEDULES],
  }

  const menu =  Object.keys(menuRoles).map(comp =>
    groupName && component && <GroupSecure key={`menu_${comp}`} contentGroupRoles={menuRoles[comp]}>
      <Button style={comp == component ? { textDecoration: 'underline' } : undefined} onClick={() => navigate(`/group/${groupName}/manage/${comp}`)}>
        {comp}
      </Button>
    </GroupSecure>
  );

  const viewPage = useMemo(() => {
    switch (component) {
      case 'users':
        return <ManageUsers {...props}
          users={users}
          getAction={GET_USERS}
        />
      case 'roles':
        return <ManageRoles {...props}
          roles={user.roles}
          getRolesAction={GET_USER_PROFILE_DETAILS}
          putRolesAction={PUT_ROLES}
          postRolesAction={POST_ROLES}
          deleteRolesAction={DELETE_ROLES}
        />
      case 'matrix':
        return <ManageRoleActions {...props} />
      case 'services':
        return <ManageServices
          services={groupServices}
          getServicesAction={GET_GROUP_SERVICES}
          postServicesAction={POST_SERVICE}
          postGroupServicesAction={POST_GROUP_SERVICE}
          putServicesAction={PUT_SERVICE}
          disableServicesAction={DISABLE_SERVICE}
          deleteServicesAction={DELETE_SERVICE}
          deleteGroupServicesAction={DELETE_GROUP_SERVICE}
        />
      case 'schedules':
        return <ManageSchedules
          schedules={groupSchedules}
          getSchedulesAction={GET_GROUP_SCHEDULES}
          postSchedulesAction={POST_SCHEDULE}
          postGroupSchedulesAction={POST_GROUP_SCHEDULE}
          putSchedulesAction={PUT_SCHEDULE}
          disableSchedulesAction={DISABLE_SCHEDULE}
          deleteSchedulesAction={DELETE_SCHEDULE}
          deleteGroupSchedulesAction={DELETE_GROUP_SCHEDULE}
        />
      default:
        return;
    }
  }, [users, groupServices, groupSchedules, user.groups, user.roles, component])

  return <>

    <Grid container justifyContent="flex-start" alignItems="center">
      <Typography variant="button">Controls:</Typography> {menu}
    </Grid>

    {viewPage}
  </>
}

export const roles = [];

export default ManageGroup;