import React, { useState, useCallback, useMemo, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { IGroup, IRole } from 'awayto/core';
import { useComponents, sh, useUtil, useSuggestions } from 'awayto/hooks';

declare global {
  interface IProps {
    showCancel?: boolean;
    editGroup?: IGroup;
  }
}

export function ManageGroupRolesModal({ children, editGroup, showCancel = true, closeModal, ...props }: IProps): React.JSX.Element {

  const { setSnack } = useUtil();

  const { SelectLookup } = useComponents();

  const {
    comp: RoleSuggestions,
    suggest: suggestRoles,
    suggestions: roleSuggestions
  } = useSuggestions();

  const { data : profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();

  const [putGroupRoles] = sh.usePutGroupRolesMutation();
  const [postRole] = sh.usePostRoleMutation();
  const [deleteRole] = sh.useDeleteRoleMutation();

  const [roleIds, setRoleIds] = useState<string[]>(Object.keys(editGroup?.roles || {}).filter(rid => editGroup?.roles[rid].name !== 'Admin'));
  const [defaultRoleId, setDefaultRoleId] = useState(editGroup && roleIds.includes(editGroup.defaultRoleId) ? editGroup.defaultRoleId : '');

  const roleValues = useMemo(() => Object.values(profile?.roles || {}), [profile]);

  const handleSubmit = useCallback(() => {
    if (!roleIds.length || !defaultRoleId) {
      setSnack({ snackType: 'error', snackOn: 'All fields are required.' });
      return;
    }

    const newRoles = {
      roles: Object.fromEntries(roleIds.map(id => [id, roleValues.find(r => r.id === id)] as [string, IRole])),
      defaultRoleId
    }

    void putGroupRoles(newRoles).unwrap().then(() => {
      closeModal && closeModal(newRoles);
    });
  }, [roleIds, defaultRoleId]);

  useEffect(() => {
    if (editGroup) {
      void suggestRoles({ id: IPrompts.SUGGEST_ROLE, prompt: `${editGroup.name}!$${editGroup.purpose}` });
    }
  }, [])

  return <>
    <Card>
      <CardHeader title="Edit Roles"></CardHeader>
      <CardContent>
        {!!children && children}

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <SelectLookup
              multiple
              helperText={!roleSuggestions.length ? 
                'Ex: Consultant, Project Manager, Advisor, Business Analyst' : 
                <RoleSuggestions handleSuggestion={suggestedRole => {
                  // The currently suggested role in the user detail's role list
                  const existingId = roleValues.find(r => r.name === suggestedRole)?.id;
        
                  // If the role is not in the user detail roles list, or it is, but it doesn't exist in the current list, continue
                  if (!existingId || (existingId && !roleIds.includes(existingId))) {
        
                    // If the role is in the user details roles list
                    if (existingId) {
                      setRoleIds([...roleIds, existingId])
                    } else {
                      postRole({ name: suggestedRole }).unwrap().then(async newRole => {
                        await getUserProfileDetails();
                        !roleIds.includes(newRole.id) && setRoleIds([...roleIds, newRole.id]);
                      }).catch(console.error);
                    }
                  }
                }} />
              }
              lookupName='Group Role'
              lookups={roleValues}
              lookupChange={(newIds: string[]) => {
                if (!newIds.length || !newIds.includes(defaultRoleId)) {
                  setDefaultRoleId('');
                }
                setRoleIds(newIds);
              }}
              lookupValue={roleIds}
              invalidValues={['admin']}
              refetchAction={getUserProfileDetails}
              createAction={postRole}
              deleteAction={deleteRole}
              deleteActionIdentifier='ids'
              {...props}
            />
          </Grid>
          {roleIds.length && <Grid item xs={12}>
            <TextField
              select
              id={`group-default-role-selection`}
              fullWidth
              helperText={'Set the group default role. When members join the group, this role will be assigned.'}
              label={`Default Role`}
              onChange={e => setDefaultRoleId(e.target.value)}
              value={defaultRoleId}
            >
              {roleIds.map(roleId => <MenuItem key={`${roleId}_primary_role_select`} value={roleId}>{roleValues.find(role => role.id === roleId)?.name || ''}</MenuItem>)}
            </TextField>
          </Grid>}
          <Grid item>
            <Alert severity="info">Your Admin role is created automatically. Only create roles for your members.</Alert>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent={showCancel ? "space-between" : "flex-end"}>
          {showCancel && <Button onClick={closeModal}>Cancel</Button>}
          <Button disabled={!defaultRoleId} onClick={handleSubmit}>Save Roles</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageGroupRolesModal;