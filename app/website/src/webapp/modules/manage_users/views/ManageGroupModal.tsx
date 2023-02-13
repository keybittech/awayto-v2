import React, { useEffect, useMemo, useState, useCallback, ChangeEvent } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { IGroup, IRole, IUtilActionTypes } from 'awayto';
import { useAct, useApi, useRedux, useComponents } from 'awayto-hooks';
import { ManageGroupsActions } from './ManageGroups';

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editGroup?: IGroup;
  }
}

export function ManageGroupModal({ editGroup, closeModal, ...props }: IProps): JSX.Element {
  const { roles, getRolesAction, putGroupsAction, postGroupsAction, postRolesAction, deleteRolesAction, checkNameAction } = props as Required<ManageGroupsActions>;
  
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();
  const { isValid, needCheckName, checkedName, checkingName } = useRedux(state => state.manageGroups);
  const [primaryRole, setPrimaryRole] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [group, setGroup] = useState<Partial<IGroup>>({
    name: '',
    ...editGroup
  });

  const formatName = useCallback((name: string) =>
    name.replaceAll(/__+/g, '_').replaceAll(/\s/g, '_').replaceAll(/[\W]+/g, '_').replaceAll(/__+/g, '_').replaceAll(/__+/g, '').toLowerCase()
    , []);

  const handleSubmit = useCallback(() => {
    const { id, name } = group;

    if (!name || !roleIds.length) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'Please provide a valid group name and roles.' });
      return;
    }
    
    group.name = formatName(name);
    group.roles = Object.values(roles).filter(r => roleIds.includes(r.id));
    group.roleId = primaryRole;
    api(id ? putGroupsAction : postGroupsAction, true, group);

    if (closeModal)
      closeModal();

  }, [group, roles, roleIds, primaryRole]);

  const badName = !checkingName && !isValid && !!group?.name && formatName(group.name) == checkedName;

  const handleName = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    act(checkNameAction, { checkingName: true });
    const name = event.target.value;
    if (name.length <= 50) {
      setGroup({ ...group, name });
      act(checkNameAction, { checkedName: formatName(name), needCheckName: name != editGroup?.name }, { debounce: { time: 1000 } });
    } else if (isValid) {
      act(checkNameAction, { checkingName: false });
    }
  }, [group, setGroup]);

  useEffect(() => {
    if (!roleIds.length && group.roles?.length)
      setRoleIds(group.roles.map(r => r.id))
  }, [roleIds, group.roles]);

  useEffect(() => {
    if (needCheckName && checkedName) {
      act(checkNameAction, { checkingName: true, needCheckName: false, isValid: false });
      const [abort] = api(checkNameAction, true, { name: checkedName });
      return () => abort();
    }
  }, [needCheckName]);

  useEffect(() => {
    if (!primaryRole) {
      setPrimaryRole(roleIds[0]);
    }
  }, [roleIds])
  
  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage {editGroup ? editGroup.name : 'group'}</Typography>
      </CardContent>
      <CardContent>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Group</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth id="name" label="Name" value={group.name} name="name" onChange={handleName}
                  multiline
                  helperText="Group names can only contain letters, numbers, and underscores. Max 50 characters."
                  error={badName}
                  InputProps={{
                    endAdornment: group.name && (
                      <InputAdornment
                        component={({ children }) =>
                          <Grid container style={{ width: 'calc(100% + 5em)', maxWidth: 'calc(100% + 5em)' }}>
                            {children}
                          </Grid>
                        }
                        position="start"
                      >
                        <Grid item style={{ alignSelf: 'center' }}>
                          {checkingName ?
                            <CircularProgress size="20px" /> :
                            badName ? <NotInterestedIcon color="error" /> : <ArrowRightAlt />}
                        </Grid>
                        <Grid item xs style={{ wordBreak: 'break-all' }}>
                          <Typography style={{
                            padding: '2px 4px',
                            border: `1px solid #666`,
                            lineHeight: '1.15em'
                          }}>
                            {formatName(group.name)}
                          </Typography>
                        </Grid>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly">
              <Grid item>
                <Typography variant="h6">Roles</Typography>
              </Grid>
              <Grid item xs={12}>
                <SelectLookup
                  multiple
                  lookupName="Group Role"
                  lookups={roles}
                  lookupChange={setRoleIds}
                  lookupValue={roleIds}
                  refetchAction={getRolesAction}
                  createAction={postRolesAction}
                  deleteAction={deleteRolesAction}
                  {...props}
                />
              </Grid>
              {primaryRole && <Grid item xs={12}>
                <TextField
                  select
                  id={`group-primary-role-selection`}
                  fullWidth
                  helperText={'Set the group admin role'}
                  label={`Admin Role`}
                  onChange={e => setPrimaryRole(e.target.value)}
                  value={primaryRole}
                >
                  {roleIds.map(roleId => <MenuItem key={`${roleId}_primary_role_select`} value={roleId}>{Object.values(roles).find(role => role.id === roleId)?.name || ''}</MenuItem>)}
                </TextField>
              </Grid>}
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent="flex-end">
          <Button onClick={closeModal}>Cancel</Button>
          <Button disabled={checkingName || badName} onClick={handleSubmit}>Submit</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageGroupModal;