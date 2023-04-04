import React, { useEffect, useState, useCallback, ChangeEvent, useMemo } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { IGroup, IUtilActionTypes, IGroupActionTypes, IAssistActionTypes, IRole, IPrompts, IAssistState } from 'awayto/core';
import { useAct, useApi, useRedux, useComponents, storeApi } from 'awayto/hooks';
import { ManageGroupsActions } from './ManageGroups';
import keycloak from '../../../keycloak';

const { SET_SNACK } = IUtilActionTypes;
const { CHECK_GROUPS_NAME } = IGroupActionTypes;
const { GET_PROMPT } = IAssistActionTypes;

declare global {
  interface IProps {
    editGroup?: IGroup;
  }
}

export function ManageGroupModal({ editGroup, closeModal, ...props }: IProps): JSX.Element {
  const { getRolesAction, putGroupsAction, postGroupsAction, postRolesAction, deleteRolesAction } = props as Required<ManageGroupsActions>;

  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const { isValid, needCheckName, checkedName, checkingName } = useRedux(state => state.group);
  const [defaultRoleId, setDefaultRoleId] = useState(editGroup?.defaultRoleId || '');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [group, setGroup] = useState({ name: '', purpose: '', allowedDomains: '', ...editGroup } as IGroup);
  const [viewStep, setViewStep] = useState(1);
  const [editedPurpose, setEditedPurpose] = useState(false);
  const [roleSuggestions, setRoleSuggestions] = useState([] as string[]);
  const [allowedDomains, setAllowedDomains] = useState([profile.username.split('@')[1]] as string[]);
  const [allowedDomain, setAllowedDomain] = useState('');

  const progressMemo = useMemo(() => <CircularProgress size="20px" />, []);
  const roleValues = useMemo(() => Object.values(profile.roles || {}), [profile]);

  const formatName = useCallback((name: string) => name
    .replaceAll(/__+/g, '_')
    .replaceAll(/\s/g, '_')
    .replaceAll(/[\W]+/g, '_')
    .replaceAll(/__+/g, '_')
    .replaceAll(/__+/g, '').toLowerCase() // Enforce a name like this_is_a_name
    , []);

  const badName = !checkingName && !isValid && !!group?.name && formatName(group.name) == checkedName;

  const handleSubmit = useCallback(() => {
    const { id, name, purpose } = group;

    if (!name || !roleIds.length || !defaultRoleId) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'All fields are required.' });
      return;
    }

    const newRoles = Object.fromEntries(roleIds.map(id => [id, profile.roles[id]])) as Record<string, IRole>;
   
    const [, res] = api(id ? putGroupsAction : postGroupsAction, { name: formatName(name), purpose, allowedDomains: allowedDomains.join(','), roles: newRoles, defaultRoleId }, { load: true });
    res?.then(() => {
      id && act(SET_SNACK, { snackType: 'success', snackOn: 'Group updated! Please allow up to a minute for any related permissions changes to persist.' })
      !id && keycloak.clearToken();
    }).catch(console.warn);
  }, [group, profile, roleIds, defaultRoleId]);


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

  const handleContinue = useCallback(() => {
    const [, res] = api(GET_PROMPT, { id: IPrompts.SUGGEST_ROLE, prompt: group.name, prompt2: group.purpose }, { load: true, useParams: true })
    res?.then(featureSuggestionData => {
      const { promptResult } = featureSuggestionData as IMergedState;
      if (promptResult) setRoleSuggestions(promptResult)
      setViewStep(2);
    });
  }, [group]);

  if (!roleIds.length && roleValues?.length && !defaultRoleId) {
    setRoleIds(Object.keys(group.roles))
  }

  if (roleIds.length && !defaultRoleId) {
    setDefaultRoleId(roleIds[0]);
  }

  useEffect(() => {
    if (needCheckName && checkedName) {
      act(CHECK_GROUPS_NAME, { checkingName: true, needCheckName: false, isValid: false });
      api(CHECK_GROUPS_NAME, { name: checkedName });
    }
  }, [needCheckName, checkedName]);

  const roleSuggestionLinks = <>
    AI: {roleSuggestions.filter(s => s.toLowerCase() !== 'admin').map((s, i) => {
      return <span key={`role-selection-${i}`}>
        <Link sx={{ cursor: 'pointer' }} onClick={() => {
          // The currently suggested role in the user detail's role list
          const existingId = roleValues.find(r => r.name === s)?.id;

          // If the role is not in the user detail roles list, or it is, but it doesn't exist in the current list, continue
          if (!existingId || (existingId && !roleIds.includes(existingId))) {

            // If the role is in the user details roles list
            if (existingId) {
              setRoleIds([...roleIds, existingId])
            } else {
              const [, res] = api(postRolesAction, { name: s }, { load: true });
              res?.then(roleData => {
                const [, rez] = api(getRolesAction);
                rez?.then(() => {
                  const [role] = roleData as IRole[];
                  !roleIds.includes(role.id) && setRoleIds([...roleIds, role.id]);
                }).catch(console.warn);
              }).catch(console.warn);
            }
          }
        }}>{s}</Link>{i !== roleSuggestions.length - 1 ? ',' : ''}&nbsp;
      </span>
    })}
  </>

  return <>
    <Card>
      <CardHeader title={(editGroup ? 'Manage' : 'Create') + ' Group'}></CardHeader>
      <CardContent>
        {1 === viewStep ? <Grid container spacing={4}>
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
              inputProps={{ minLength: 25, maxLength: 100 }}
              helperText={'Enter a short phrase about the function of your group (25 to 100 characters).'}
              label={`Group Purpose`}
              error={editedPurpose && !!group.purpose && group.purpose.length < 25}
              onBlur={() => setEditedPurpose(true)}
              onFocus={() => setEditedPurpose(false)}
              onChange={e => setGroup({ ...group, purpose: e.target.value })}
              value={group.purpose}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id={`group-allowed-domains-entry`}
              fullWidth
              helperText={`These domains will be allowed to join the group. Remove all for unrestricted access.`}
              label={`Allowed Domains`}
              onChange={e => setAllowedDomain(e.target.value)}
              value={allowedDomain}
              InputProps={{
                endAdornment: <Button
                  variant="text"
                  color="secondary"
                  onClick={() => {
                    if (!/[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/.test(allowedDomain)) {
                      act(SET_SNACK, { snackType: 'info', snackOn: 'Must be an email domain, like DOMAIN.COM'})
                    } else {
                      setAllowedDomains([ ...allowedDomains, allowedDomain ])
                      setAllowedDomain('');
                    }
                  }}
                >Add</Button>
              }}
            />
            <Grid container>
              {allowedDomains.map((ad, i) => <Box key={`allowed-domain-selection-${i}`} mt={2} mr={2}>
                <Chip
                  label={ad}
                  color="secondary"
                  onDelete={() => {
                    setAllowedDomains(allowedDomains.filter(da => da !== ad))
                  }}
                />
              </Box>)}
            </Grid>
          </Grid>
        </Grid> :
          <Grid container spacing={4}>
            <Grid item>
              <Typography variant="h6">Roles</Typography>
              <Typography variant="body2">Each group needs a set of roles to assign to its users. After creating this group, visit the Matrix page to assign site functionality to your roles.</Typography>
            </Grid>
            <Grid item xs={12}>
              <SelectLookup
                multiple
                helperText={!roleSuggestions.length ? 'Ex: Consultant, Project Manager, Advisor, Business Analyst' : roleSuggestionLinks}
                lookupName="Group Role"
                lookups={roleValues}
                lookupChange={setRoleIds}
                lookupValue={roleIds}
                invalidValues={['admin']}
                refetchAction={getRolesAction}
                createAction={postRolesAction}
                deleteAction={deleteRolesAction}
                {...props}
              />
            </Grid>
            {defaultRoleId && <Grid item xs={12}>
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
              <Alert severity="info">An Admin group is created automatically. Only create groups for your members.</Alert>
            </Grid>
          </Grid>}
      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          {1 === viewStep ? <Grid container justifyContent="space-between">
            <Button onClick={closeModal}>Cancel</Button>
            <Button
              disabled={group.purpose.length < 25 || !isValid || checkingName || badName}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Grid> : <Grid container justifyContent="space-between">
            <Button onClick={() => { setViewStep(1); }}>Back</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </Grid>}        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageGroupModal;