import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { IRoleActionTypes, IUserActionTypes, IUserProfileActionTypes, IGroupServiceActionTypes, IGroupScheduleActionTypes, IServiceActionTypes, SiteRoles, IGroupFormActionTypes } from 'awayto';
import { useComponents, useRedux } from 'awayto-hooks';

const { APP_GROUP_ADMIN, APP_GROUP_ROLES, APP_GROUP_SCHEDULES, APP_GROUP_SERVICES, APP_GROUP_USERS } = SiteRoles;

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_USERS } = IUserActionTypes;
const { PUT_ROLES, POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { POST_SERVICE, PUT_SERVICE, DELETE_SERVICE, DISABLE_SERVICE } = IServiceActionTypes;
const { GET_GROUP_SERVICES, POST_GROUP_SERVICE, DELETE_GROUP_SERVICE } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES, GET_GROUP_SCHEDULE_MASTER_BY_ID, POST_GROUP_SCHEDULE, PUT_GROUP_SCHEDULE, DELETE_GROUP_SCHEDULE } = IGroupScheduleActionTypes;
const { GET_GROUP_FORMS, GET_GROUP_FORM_BY_ID, POST_GROUP_FORM, POST_GROUP_FORM_VERSION, PUT_GROUP_FORM, DELETE_GROUP_FORM } = IGroupFormActionTypes;

declare global {
  interface IProps {
    view?: string;
  }
}

export function ManageGroupHome(props: IProps): JSX.Element {
  const { groupName, component } = useParams();

  const navigate = useNavigate();

  const { roles } = useRedux(state => state.profile);
  const { users } = useRedux(state => state.user);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const { groupForms } = useRedux(state => state.groupForm);

  const { ManageFeedback, ManageUsers, ManageRoles, ManageRoleActions, ManageForms, ManageServices, ManageSchedules, GroupSecure } = useComponents();

  const menuRoles: Record<string, SiteRoles[]> = {
    users: [APP_GROUP_USERS],
    roles: [APP_GROUP_ROLES],
    matrix: [APP_GROUP_ADMIN],
    feedback: [APP_GROUP_ADMIN],
    forms: [APP_GROUP_ADMIN],
    services: [APP_GROUP_SERVICES],
    schedules: [APP_GROUP_SCHEDULES],
  }

  const menu = Object.keys(menuRoles).map(comp =>{
    const selected = comp === component;
    return groupName && component && <GroupSecure key={`menu_${comp}`} contentGroupRoles={menuRoles[comp]}>
      <Grid item>
        <Link
          variant="button"
          color={selected ? "secondary" : "primary"}
          sx={{ cursor: 'pointer' }}
          style={selected ? { textDecoration: 'underline' } : undefined}
          onClick={() => navigate(`/group/${groupName}/manage/${comp}`)}
        >
          {comp}
        </Link>
      </Grid>
    </GroupSecure>
  });

  const viewPage = useMemo(() => {
    switch (component) {
      case 'users':
        return <ManageUsers {...props}
          users={users}
          getAction={GET_USERS}
        />
      case 'roles':
        return <ManageRoles {...props}
          roles={roles}
          getRolesAction={GET_USER_PROFILE_DETAILS}
          putRolesAction={PUT_ROLES}
          postRolesAction={POST_ROLES}
          deleteRolesAction={DELETE_ROLES}
        />
      case 'matrix':
        return <ManageRoleActions {...props} />
      case 'forms':
        return <ManageForms
          groupForms={groupForms}
          getGroupFormsAction={GET_GROUP_FORMS}
          postGroupFormsAction={POST_GROUP_FORM}
          postFormVersionAction={POST_GROUP_FORM_VERSION}
          getGroupFormByIdAction={GET_GROUP_FORM_BY_ID}
          putGroupFormsAction={PUT_GROUP_FORM}
          deleteGroupFormsAction={DELETE_GROUP_FORM}
          {...props}
        />
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
          {...props}
        />
      case 'schedules':
        return <ManageSchedules
          groupSchedules={groupSchedules}
          getGroupSchedulesAction={GET_GROUP_SCHEDULES}
          getGroupScheduleMasterByIdAction={GET_GROUP_SCHEDULE_MASTER_BY_ID}
          postGroupSchedulesAction={POST_GROUP_SCHEDULE}
          putGroupSchedulesAction={PUT_GROUP_SCHEDULE}
          deleteGroupSchedulesAction={DELETE_GROUP_SCHEDULE}
          {...props}
        />
      case 'feedback':
        return <ManageFeedback
          {...props}
        />
      default:
        return;
    }
  }, [users, groupServices, groupSchedules, groupForms, roles, component])

  return <>

    <Grid container pb={2} spacing={2} justifyContent="flex-start" alignItems="center">
      <Grid item>
        <Typography variant="button">Controls:</Typography> 
      </Grid>
      {menu}
    </Grid>

    {viewPage}
  </>
}

export const roles = [];

export default ManageGroupHome;