import React, { useCallback, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';

import { GridColDef } from '@mui/x-data-grid';

import { SiteRoles, IGroupRoleAuthActions } from 'awayto/core';
import { useGrid, useAppSelector, sh, useUtil } from 'awayto/hooks';
import { useParams } from 'react-router';

export function ManageRoleActions(): JSX.Element {
  const { groupName } = useParams();
  if (!groupName) return <></>;

  const { setSnack, setUpdateAssignments } = useUtil();
  const [putAssignments] = sh.usePutGroupAssignmentsMutation();

  const { data: availableGroupAssignments } = sh.useGetGroupAssignmentsQuery({ groupName })

  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const { canSubmitAssignments } = useAppSelector(state => state.util);
  
  const [assignments, setAssignments] = useState(availableGroupAssignments || {});

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);

  const handleCheck = useCallback((subgroup: string, action: string, add: boolean) => {
    const newAssignments = { ...assignments };
    newAssignments[subgroup] = { actions: add ? [...(newAssignments[subgroup]?.actions || []), { name: action }] : newAssignments[subgroup]?.actions.filter(a => a.name !== action) };
    setAssignments(newAssignments);
  }, [assignments]);

  const handleSubmit = useCallback(() => {
    try {
      setUpdateAssignments({ canSubmitAssignments: false });
      putAssignments({ groupName, assignments }).unwrap().then(() => {
        setSnack({ snackType: 'success', snackOn: 'Assignments can be updated again in 1 minute.' });
        setTimeout(() => setUpdateAssignments({ canSubmitAssignments: true }), 58 * 1000);
      }).catch(console.error);
    } catch (error) {
      setUpdateAssignments({ canSubmitAssignments: true });
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