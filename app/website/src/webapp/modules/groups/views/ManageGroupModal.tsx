import React, { useEffect, useState, useCallback, ChangeEvent, useMemo } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { IGroup, IUtilActionTypes, IGroupActionTypes, IRole } from 'awayto';
import { useAct, useApi, useRedux, useComponents } from 'awayto-hooks';
import { ManageGroupsActions } from './ManageGroups';
import keycloak from '../../../keycloak';

const { SET_SNACK } = IUtilActionTypes;
const { CHECK_GROUPS_NAME } = IGroupActionTypes;

declare global {
  interface IProps {
    editGroup?: IGroup;
  }
}

export function ManageGroupModal({ editGroup, closeModal, ...props }: IProps): JSX.Element {
  const { roles, getRolesAction, putGroupsAction, postGroupsAction, postRolesAction, deleteRolesAction } = props as Required<ManageGroupsActions>;
  
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();
  const { isValid, needCheckName, checkedName, checkingName, flagged } = useRedux(state => state.group);
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
    const { id, name, purpose } = group;

    if (!name || !roleIds.length || !primaryRole) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'Please provide a valid group name and roles.' });
      return;
    }
    
    const mapRoleIds = new Map(roleIds.map(id => [id, roles.get(id) as IRole]));

    const [, res] = api(id ? putGroupsAction : postGroupsAction, { name: formatName(name), purpose, roles: Array.from(mapRoleIds.values()), roleId: primaryRole }, { load: true });
    res?.then(() => {
      id && act(SET_SNACK, { snackType: 'success', snackOn: 'Group updated! Please allow up to a minute for any related permissions changes to persist.' } )
      !id && keycloak.clearToken();
    }).catch(console.warn);
  }, [group, roles, roleIds, primaryRole]);

  const badName = !checkingName && !isValid && !!group?.name && formatName(group.name) == checkedName;

  const handleName = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    act(CHECK_GROUPS_NAME, { checkingName: true });
    const name = event.target.value;
    if (name.length <= 50) {
      setGroup({ ...group, name });
      act(CHECK_GROUPS_NAME, { checkedName: formatName(name), needCheckName: name != editGroup?.name }, { debounce: { time: 1000 } });
    } else if (isValid) {
      act(CHECK_GROUPS_NAME, { checkingName: false });
    }
  }, [group, editGroup]);

  const progressMemo = useMemo(() => <CircularProgress size="20px" />, []);

  useEffect(() => {
    if (!roleIds.length && group.roles?.size && !primaryRole)
      setRoleIds(Array.from(group.roles.keys()))
  }, [roleIds, group.roles, primaryRole]);

  useEffect(() => {
    if (needCheckName && checkedName) {
      act(CHECK_GROUPS_NAME, { checkingName: true, needCheckName: false, isValid: false });
      api(CHECK_GROUPS_NAME, { name: checkedName }, { load: true, debounce: { time: 1000 } });
    }
  }, [needCheckName, checkedName]);

  useEffect(() => {
    if (!primaryRole) {
      setPrimaryRole(roleIds[0]);
    }
  }, [roleIds])
  
  useEffect(() => {
    if (flagged) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'A moderation event has been flagged. This will be recorded.' })
      act(CHECK_GROUPS_NAME, { flagged: false });
    }
  }, [flagged])
  
  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage {editGroup ? editGroup.name : 'group'}</Typography>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Group</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  label="Name"
                  value={group.name}
                  name="name"
                  onChange={handleName}
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
                          {checkingName ? progressMemo :
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
              <Grid item xs={12}>
                <TextField
                  id={`group-purpose-entry`}
                  fullWidth
                  inputProps={{ maxLength: 100 }}
                  helperText={'Enter a short phrase about the function of your group (100 characters).'}
                  label={`Group Purpose`}
                  onChange={e => setGroup({ ...group, purpose: e.target.value })}
                  value={group.purpose}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly">
              <Grid item>
                <Typography variant="h6">Roles</Typography>
                <Typography variant="body2">Each group needs a set of roles to assign to its users. After creating this group, visit the Matrix page to assign site functionality to your roles.</Typography>
              </Grid>
              <Grid item xs={12}>
                <SelectLookup
                  multiple
                  lookupName="Group Role"
                  lookups={Array.from(roles.values())}
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
                  {roleIds.map(roleId => <MenuItem key={`${roleId}_primary_role_select`} value={roleId}>{Array.from(roles.values()).find(role => role.id === roleId)?.name || ''}</MenuItem>)}
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