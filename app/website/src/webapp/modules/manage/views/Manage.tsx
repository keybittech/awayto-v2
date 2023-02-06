import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { IManageGroupsActionTypes } from 'awayto';
import { useComponents } from 'awayto-hooks';

const { GET_MANAGE_GROUPS, DELETE_MANAGE_GROUPS } = IManageGroupsActionTypes;

declare global {
  interface IProps {
    view?: string;
  }
}

export function Manage(props: IProps): JSX.Element {
  const { component } = useParams();

  const navigate = useNavigate();

  const { ManageUsers, ManageGroups, ManageRoles, ManageRoleActions, Secure } = useComponents();

  const menu = ['users', 'groups', 'roles', 'matrix'].map(comp =>
    <Button key={`menu_${comp}`} style={comp == component ? { textDecoration: 'underline' } : undefined} onClick={() => navigate(`/manage/${comp}`)}>
      {comp}
    </Button>
  );

  const viewPage = useMemo(() => {
    switch (component) {
      case 'users':
        return <ManageUsers {...props} />
      case 'groups':
        return <ManageGroups getAction={GET_MANAGE_GROUPS} deleteAction={DELETE_MANAGE_GROUPS} {...props} />
      case 'roles':
        return <ManageRoles {...props} />
      case 'matrix':
        return <ManageRoleActions {...props} />
      default:
        return;
    }
  }, [component])

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