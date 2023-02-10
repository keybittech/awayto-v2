import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { IGroupActionTypes, IRoleActionTypes, IUserActionTypes } from 'awayto';
import { useComponents, useRedux } from 'awayto-hooks';

const { GET_USERS } = IUserActionTypes; 
const { GET_ROLES, PUT_ROLES, POST_ROLES } = IRoleActionTypes;
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
          getAction={GET_GROUPS}
          deleteAction={DELETE_GROUPS}
          putAction={PUT_GROUPS}
          postAction={POST_GROUPS}
          checkNameAction={CHECK_GROUPS_NAME}
          getRolesAction={GET_ROLES} />
      case 'roles':
        return <ManageRoles {...props}
          roles={roles}
          getAction={GET_ROLES}
          putAction={PUT_ROLES}
          postAction={POST_ROLES}
        />
      case 'matrix':
        return <ManageRoleActions {...props} />
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