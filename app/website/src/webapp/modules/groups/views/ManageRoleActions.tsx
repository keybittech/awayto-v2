import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';

import { IUtilActionTypes, SiteRoles, IGroupActionTypes, IGroupRoleActions, IUserProfileActionTypes } from 'awayto';
import { useApi, useRedux, useStyles, useAct } from 'awayto-hooks';
import { useParams } from 'react-router';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { SET_SNACK, SET_UPDATE_ASSIGNMENTS } = IUtilActionTypes;
const { PUT_GROUPS_ASSIGNMENTS, GET_GROUPS_ASSIGNMENTS } = IGroupActionTypes;

export function ManageRoleActions(): JSX.Element {
  const { groupName } = useParams();
  const api = useApi();
  const act = useAct();
  const classes = useStyles();
  const util = useRedux(state => state.util);
  const { availableGroupAssignments } = useRedux(state => state.group);
  const { groups } = useRedux(state => state.profile);
  const [assignments, setAssignments] = useState<Record<string, IGroupRoleActions>>({});

  useEffect(() => {
    if (Object.keys(availableGroupAssignments).length) {
      setAssignments(availableGroupAssignments);
    }
  }, [availableGroupAssignments])

  useEffect(() => {
    if (!groupName) return;
    const [abort1] = api(GET_USER_PROFILE_DETAILS, true);
    const [abort2] = api(GET_GROUPS_ASSIGNMENTS, true, { groupName });
    return () => {
      abort1();
      abort2();
    }
  }, [groupName]);

  const handleCheck = useCallback((subgroup: string, action: string, add: boolean) => {
    const newAssignments = { ...assignments };
    newAssignments[subgroup] = { actions: add ? [...(newAssignments[subgroup]?.actions || []), { name: action }] : newAssignments[subgroup]?.actions.filter(a => a.name !== action) };
    setAssignments(newAssignments);
  }, [assignments]);

  const handleSubmit = useCallback(() => {
    try {
      act(SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: false });
      const [, res] = api(PUT_GROUPS_ASSIGNMENTS, false, { groupName, assignments });
      res?.then(() => {
        act(SET_SNACK, { snackType: 'success', snackOn: 'Assignments can be updated again in 1 minute.' });
        setTimeout(() => act(SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: true }), 58 * 1000);
      });
    } catch (error) {
      act(SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: true });
    }
  }, [groupName, assignments]);

  const columns = useMemo(() => {
    if (!groups) return [];
    const group = Object.values(groups).find(g => g.name === groupName);
    const groupRoles = Object.values(group?.roles || {});
    if (!groupRoles.length || !Object.keys(assignments) || !groupName) return [];
    return [
      { selector: (row: { name: string }) => row.name },
      ...groupRoles.reduce((memo, { name }) => {
        const subgroup = `/${groupName}/${name}`;
        memo.push({ name, cell: row => <Checkbox checked={assignments[subgroup] ? assignments[subgroup].actions.some(a => a.name === row.name) : false} onChange={e => handleCheck(subgroup, row.name, e.target.checked)} /> });
        return memo;
      }, [] as TableColumn<{ name: string }>[])
    ]
  }, [groups, assignments, groupName]);

  const options = useMemo(() => Object.values(SiteRoles).filter(r => ![SiteRoles.APP_ROLE_CALL, SiteRoles.APP_GROUP_ADMIN].includes(r)).map(name => ({ name })), []);

  return <>

    <Grid container>
      <Grid item mb={2} xs={12}>
        <Card>
          <CardActionArea disabled={!util.canSubmitAssignments} onClick={handleSubmit}>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item>
                <Box m={2}>
                  <Typography color="secondary" variant="button">Update Assignments </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box m={2}>
                  <Typography color="GrayText" variant="button">Changes will persist within 1 minute</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardActionArea>
        </Card>
      </Grid>
    </Grid>

    <Card>
      <CardContent>
        <DataTable
          className={classes.datatable}
          title="Action-Role Matrix"
          data={options}
          theme={util.theme}
          columns={columns}
        />
      </CardContent>
    </Card>

  </>
}

export default ManageRoleActions;