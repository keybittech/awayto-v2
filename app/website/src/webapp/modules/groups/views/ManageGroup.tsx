import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { IGroupActionTypes, IRoleActionTypes, IUserActionTypes, IUserProfileActionTypes, SiteRoles } from 'awayto';
import { useComponents, useRedux } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_USERS } = IUserActionTypes; 
const { PUT_ROLES, POST_ROLES, DELETE_ROLES } = IRoleActionTypes;
const { CHECK_GROUPS_NAME, PUT_GROUPS, POST_GROUPS, GET_GROUPS, DELETE_GROUPS } = IGroupActionTypes;


declare global {
  interface IProps {
    view?: string;
  }
}

export function ManageGroup(props: IProps): JSX.Element {
  const { component } = useParams();

  const navigate = useNavigate();

  const user = useRedux(state => state.profile);
  const { roles } = useRedux(state => state.role);
  const { users } = useRedux(state => state.user);

  const { ManageUsers, ManageRoles, ManageRoleActions, GroupSecure } = useComponents();

  const menuRoles: Record<string, SiteRoles[]> = {
    users: [SiteRoles.APP_GROUP_USERS],
    roles: [SiteRoles.APP_GROUP_ROLES],
    matrix: [SiteRoles.APP_GROUP_MATRIX]
  }

  const menu = ['users', 'roles', 'matrix'].map(comp =>
    <GroupSecure key={`menu_${comp}`} contentGroupRoles={menuRoles[comp]}>
      <Button style={comp == component ? { textDecoration: 'underline' } : undefined} onClick={() => navigate(`/manage/${comp}`)}>
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
        return <ManageRoleActions {...props}
          roles={user.roles}
          getRolesAction={GET_USER_PROFILE_DETAILS}  
        />
      default:
        return;
    }
  }, [roles, users, user.groups, user.roles, component])

  return <>
    <h1>Manage</h1>
    <Grid container direction="row" spacing={1}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <CardActions>
              <Grid container justifyContent="flex-start" alignItems="center">
                <Typography variant="button">Identity:</Typography> {menu}
              </Grid>
            </CardActions>
            <>
              {viewPage}
            </>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </>
}

export const roles = [];

export default ManageGroup;