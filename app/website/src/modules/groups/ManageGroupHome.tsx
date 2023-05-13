import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { SiteRoles} from 'awayto/core';
import { useComponents } from 'awayto/hooks';

const { APP_GROUP_ADMIN, APP_GROUP_ROLES, APP_GROUP_SCHEDULES, APP_GROUP_SERVICES, APP_GROUP_USERS } = SiteRoles;

export function ManageGroupHome(props: IProps): React.JSX.Element {
  const { groupName, component } = useParams();

  if (!groupName || !component) return <></>;

  const navigate = useNavigate();

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
        return <ManageUsers {...props} />
      case 'roles':
        return <ManageRoles {...props} />
      case 'matrix':
        return <ManageRoleActions {...props} />
      case 'forms':
        return <ManageForms {...props} />
      case 'services':
        return <ManageServices {...props} />
      case 'schedules':
        return <ManageSchedules {...props} />
      case 'feedback':
        return <ManageFeedback {...props} />
      default:
        return;
    }
  }, [component])

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