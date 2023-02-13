import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { IGroupActionTypes, IRoleActionTypes, IUserActionTypes, IUserProfileActionTypes } from 'awayto';
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

export function Manage(props: IProps): JSX.Element {
  const { component } = useParams();

  const navigate = useNavigate();

  const user = useRedux(state => state.profile);
  const { roles } = useRedux(state => state.role);
  const { users } = useRedux(state => state.user);

  const { ManageUsers, ManageGroups, ManageRoles, ManageRoleActions } = useComponents();

  const menu = ['users', 'groups', 'roles', 'matrix'].map(comp =>
    <Button key={`menu_${comp}`} style={comp == component ? { textDecoration: 'underline' } : undefined} onClick={() => navigate(`/manage/${comp}`)}>
      {comp}
    </Button>
  );

  const viewPage = useMemo(() => {
    switch (component) {
      case 'users':
        return <ManageUsers {...props}
          users={users}
          getAction={GET_USERS}
        />
      case 'groups':
        return <ManageGroups {...props}
          groups={user.groups}
          roles={user.roles}
          getGroupsAction={GET_GROUPS}
          deleteGroupsAction={DELETE_GROUPS}
          putGroupsAction={PUT_GROUPS}
          postGroupsAction={POST_GROUPS}
          checkNameAction={CHECK_GROUPS_NAME}
          getRolesAction={GET_USER_PROFILE_DETAILS}
          deleteRolesAction={DELETE_ROLES}
          postRolesAction={POST_ROLES}
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

export default Manage;