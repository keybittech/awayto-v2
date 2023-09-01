import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';

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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { IGroup, IRole } from 'awayto/core';
import { useComponents, sh, useDebounce, useUtil, useSuggestions } from 'awayto/hooks';

import keycloak from '../../keycloak';

declare global {
  interface IProps {
    editGroup?: IGroup;
  }
}

export function ManageGroupModal({ children, editGroup, closeModal, ...props }: IProps): React.JSX.Element {

  const { setSnack } = useUtil();

  const { SelectLookup } = useComponents();

  const {
    comp: RoleSuggestions,
    suggest: suggestRoles,
    suggestions: roleSuggestions
  } = useSuggestions();

  const { data : profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();

  const [putGroup] = sh.usePutGroupMutation();
  const [postGroup] = sh.usePostGroupMutation();
  const [postRole] = sh.usePostRoleMutation();
  const [deleteRole] = sh.useDeleteRoleMutation();

  const [group, setGroup] = useState({ name: '', displayName: '', purpose: '', allowedDomains: '', ...editGroup } as IGroup);
  const debouncedName = useDebounce(group.name, 1000);

  const { data: nameCheck } = sh.useCheckGroupNameQuery({ name: debouncedName }, { skip: !debouncedName });
  const { isValid } = nameCheck || { isValid: false };

  const [defaultRoleId, setDefaultRoleId] = useState(editGroup?.defaultRoleId || '');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [viewStep, setViewStep] = useState(1);
  const [editedPurpose, setEditedPurpose] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState([] as string[]);
  const [allowedDomain, setAllowedDomain] = useState('');

  const [{ checkedName, checkingName }, setChecker] = useState<Partial<{
    checkedName: string,
    checkingName: boolean
  }>>({
    checkedName: '',
    checkingName: false
  });

  const progressMemo = useMemo(() => <CircularProgress size="20px" />, []);
  const roleValues = useMemo(() => Object.values(profile?.roles || {}), [profile]);

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
      setSnack({ snackType: 'error', snackOn: 'All fields are required.' });
      return;
    }
   
    (id ? putGroup : postGroup)({
      id,
      displayName: name,
      name: formatName(name),
      purpose,
      allowedDomains: allowedDomains.join(','),
      roles: Object.fromEntries(roleIds.map(id => [id, roleValues.find(r => r.id === id)] as [string, IRole])),
      defaultRoleId
    }).unwrap().then(() => {
      id && setSnack({ snackType: 'success', snackOn: 'Group updated! Please allow up to a minute for any related permissions changes to persist.' })
      !id && keycloak.clearToken();
    }).catch(console.error);
  }, [group, profile, roleIds, defaultRoleId]);

  const handleName = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setChecker({ checkingName: true });
    const name = event.target.value;
    if (name.length <= 50) {
      setGroup({ ...group, name });
      setChecker({ checkedName: formatName(name) });
    } else if (isValid) {
      setChecker({ checkingName: false });
    }
  }, [group, editGroup]);

  const handleContinue = useCallback(() => {
    suggestRoles({ id: IPrompts.SUGGEST_ROLE, prompt: `${group.name}!$${group.purpose}` }).then(() => {
      setViewStep(2);
    }).catch(console.error);
  }, [group]);

  if (!roleIds.length && roleValues?.length && group.roles && !defaultRoleId) {
    setRoleIds(Object.keys(group.roles))
  }

  if (roleIds.length && !defaultRoleId) {
    setDefaultRoleId(roleIds[0]);
  }

  return <>
    <Card>
      <CardHeader title={(editGroup ? 'Manage' : 'Create') + ' Group'}></CardHeader>
      <CardContent>
        {!!children && children}

        {1 === viewStep ? <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="name"
              label="Group Name"
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
              label={`Group Description`}
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
              helperText={`These email domains will be allowed to join the group. Leaving this empty means anyone can join.`}
              label={`Allowed Email Domains`}
              onChange={e => setAllowedDomain(e.target.value)}
              value={allowedDomain}
              InputProps={{
                endAdornment: <Button
                  variant="text"
                  color="secondary"
                  onClick={() => {
                    if (!/[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/.test(allowedDomain)) {
                      setSnack({ snackType: 'info', snackOn: 'Must be an email domain, like DOMAIN.COM'})
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
              <Typography variant="body2">All activities across the site are determined by a user's role. The default role is automatically assigned to everyone who joins your group. After your group is created, an individual user's role can be changed on the Users tab, when viewing Group details. Site functionality can be assigned to Roles on the Matrix tab.</Typography>
            </Grid>
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
                lookupChange={setRoleIds}
                lookupValue={roleIds}
                invalidValues={['admin']}
                refetchAction={getUserProfileDetails}
                createAction={postRole}
                deleteAction={deleteRole}
                deleteActionIdentifier='ids'
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
              <Alert severity="info">Your Admin role is created automatically. Only create roles for your members.</Alert>
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
              Next: Roles
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