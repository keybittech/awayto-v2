import React, { Suspense, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { SiteRoles } from 'awayto/core';
import { useContexts, useComponents, useUtil } from 'awayto/hooks';

const { APP_GROUP_ADMIN, APP_GROUP_ROLES, APP_GROUP_SCHEDULES, APP_GROUP_SERVICES, APP_GROUP_USERS } = SiteRoles;

export function ManageGroupHome(props: IProps): React.JSX.Element {

  const { component } = useParams();
  if (!component) return <></>;

  const { setSnack } = useUtil();

  const {
    group
  } = useContext(useContexts().GroupContext) as GroupContextType;

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

  const menu = Object.keys(menuRoles).map(comp => {
    const selected = comp === component;
    return group.name && component && <GroupSecure key={`menu_${comp}`} contentGroupRoles={menuRoles[comp]}>
      <Grid item>
        <Button
          variant="text"
          color={selected ? "primary" : "secondary"}
          sx={{
            cursor: 'pointer',
            textDecoration: selected ? 'underline' : undefined
          }}
          onClick={() => navigate(`/group/${group.name}/manage/${comp}`)}
        >
          {comp}
        </Button>
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
  }, [component]);

  const copyCode = () => {
    window.navigator.clipboard.writeText(group.code).catch(console.error);
    setSnack({ snackType: 'success', snackOn: 'Group code copied to clipboard!' })
  }

  const groupUrl = `https://${window.location.hostname}/join/${group.code}`;

  const copyUrl = () => {
    window.navigator.clipboard.writeText(groupUrl).catch(console.error);
    setSnack({ snackType: 'success', snackOn: 'Invite URL copied to clipboard!' })
  }

  return <>

    <Card sx={{ mb: 2 }}>
      <CardHeader title={group.displayName} subheader={group.purpose} />
      <CardContent>

        <Box mb={2}>
          <Alert sx={{ py: 0 }} icon={false} severity="info">
            <Typography fontWeight={500}>Group Code:</Typography>
            <Tooltip title="Copy Group Code">
              <Link sx={{ cursor: 'pointer' }} onClick={copyCode}>{group.code}</Link>

            </Tooltip>
          </Alert>
        </Box>

        <Box mb={2}>
          <Alert sx={{ py: 0 }} icon={false} severity="info">
            <Typography fontWeight={500}>Invite Url</Typography>
            <Tooltip title="Copy Invite URL">
              <Link sx={{ cursor: 'pointer' }} onClick={copyUrl} variant="body2">{groupUrl}</Link>
            </Tooltip>
          </Alert>
        </Box>
      </CardContent>
    </Card>




    <Grid container pb={2} spacing={2} justifyContent="flex-start" alignItems="center">
      <Grid item>
        <Typography variant="button">Controls:</Typography>
      </Grid>
      {menu}
    </Grid>

    <Suspense>
      {viewPage}
    </Suspense>
  </>
}

export const roles = [];

export default ManageGroupHome;