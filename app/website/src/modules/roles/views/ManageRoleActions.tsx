import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';

import { IUtilActionTypes, SiteRoles, IGroupActionTypes, IGroupRoleAuthActions, IUserProfileActionTypes } from 'awayto/core';
import { useApi, useRedux, useAct, useGrid, storeApi, useAppSelector } from 'awayto/hooks';
import { useParams } from 'react-router';
import { GridColDef } from '@mui/x-data-grid';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { SET_SNACK, SET_UPDATE_ASSIGNMENTS } = IUtilActionTypes;
const { PUT_GROUPS_ASSIGNMENTS, GET_GROUPS_ASSIGNMENTS } = IGroupActionTypes;

export function ManageRoleActions(): JSX.Element {
  const { groupName } = useParams();
  const api = useApi();
  const act = useAct();
  
  const { canSubmitAssignments } = useAppSelector(state => state.util);

  const { availableGroupAssignments } = useRedux(state => state.group);

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const [assignments, setAssignments] = useState<Record<string, IGroupRoleAuthActions>>({});

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);

  useEffect(() => {
    if (Object.keys(availableGroupAssignments).length) {
      setAssignments(availableGroupAssignments);
    }
  }, [availableGroupAssignments])

  useEffect(() => {
    if (!groupName) return;
    const [abort1] = api(GET_USER_PROFILE_DETAILS);
    const [abort2] = api(GET_GROUPS_ASSIGNMENTS, { groupName });
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
      const [, res] = api(PUT_GROUPS_ASSIGNMENTS, { groupName, assignments });
      res?.then(() => {
        act(SET_SNACK, { snackType: 'success', snackOn: 'Assignments can be updated again in 1 minute.' });
        setTimeout(() => act(SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: true }), 58 * 1000);
      }).catch(console.warn);
    } catch (error) {
      act(SET_UPDATE_ASSIGNMENTS, { canSubmitAssignments: true });
    }
  }, [groupName, assignments]);

  const columns = useMemo(() => {
    if (groupsValues.length && groupName) {
      const group = groupsValues.find(g => g.name === groupName);
      if (group && Object.keys(group.roles).length) {

        const cols: GridColDef<{ name: string }>[] = [{ width: 200, field: 'id', headerName: '', renderCell: ({ row }) => row.name } as GridColDef<{ name: string }>];
        
        for (const roleId in group.roles) {
          const { name } = group.roles[roleId];
          const subgroup = `/${groupName}/${name}`;
          cols.push({
            flex: 1,
            minWidth: 75,
            headerName: name,
            field: name,
            renderCell: ({ row }) => <Checkbox
              checked={assignments[subgroup] ? assignments[subgroup].actions.some(a => a.name === row.name) : false}
              onChange={e => handleCheck(subgroup, row.name, e.target.checked)}
            />
          });
        }
        
        return cols;
      }
    }
    return [];
  }, [groupsValues, assignments, groupName]);

  const options = useMemo(() => Object.values(SiteRoles).filter(r => ![SiteRoles.APP_ROLE_CALL, SiteRoles.APP_GROUP_ADMIN].includes(r)).map((name, id) => ({ id, name })), []);

  const RoleActionGrid = useGrid({
    rows: options,
    columns,
    noPagination: true
  });

  return <>

    <Grid container>
      <Grid item mb={2} xs={12}>
        <Card>
          <CardActionArea disabled={!canSubmitAssignments} onClick={handleSubmit}>
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

    <RoleActionGrid />

  </>
}

export default ManageRoleActions;