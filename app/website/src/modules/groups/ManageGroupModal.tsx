import React, { useState, useRef, useCallback, useEffect, ChangeEvent, useMemo } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { IGroup, } from 'awayto/core';
import { sh, useDebounce, useUtil } from 'awayto/hooks';

declare global {
  interface IProps {
    editGroup?: IGroup;
  }
}

export function ManageGroupModal({ children, editGroup, closeModal }: IProps): React.JSX.Element {

  const { setSnack } = useUtil();
  
  const [group, setGroup] = useState({ name: '', displayName: '', purpose: '', allowedDomains: '', ...editGroup } as IGroup);
  const initialized = useRef(false);
  const debouncedName = useDebounce(group.name, 1000);
  const [skipQuery, setSkipQuery] = useState(true);

  const { data: nameCheck } = sh.useCheckGroupNameQuery({ name: debouncedName }, { skip: !debouncedName || skipQuery });
  const { isValid } = nameCheck || { isValid: false };

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

  const [postGroup] = sh.usePostGroupMutation();
  const [putGroup] = sh.usePutGroupMutation();

  const progressMemo = useMemo(() => <CircularProgress size="20px" />, []);

  const formatName = useCallback((name: string) => name
    .replaceAll(/__+/g, '_')
    .replaceAll(/\s/g, '_')
    .replaceAll(/[\W]+/g, '_')
    .replaceAll(/__+/g, '_')
    .replaceAll(/__+/g, '').toLowerCase() // Enforce a name like this_is_a_name
    , []);

  const badName = !checkingName && !isValid && !!group?.name && formatName(group.name) == checkedName;

  const handleSubmit = useCallback(() => {
    if (!group.name || !group.purpose) {
      setSnack({ snackType: 'error', snackOn: 'All fields are required.' });
      return;
    }

    const newGroup = {
      ...group,
      allowedDomains: allowedDomains.join(',')
    };

    (group.id ? putGroup : postGroup)(newGroup).unwrap().then(({ id: groupId }: { id: string }) => {
      closeModal && closeModal({ ...newGroup, id: groupId });
    }).catch(console.error);
  }, [group]);

  const handleName = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setChecker({ checkingName: true });
    const displayName = event.target.value;
    const name = formatName(displayName);
    if (name.length <= 50) {
      setGroup({ ...group, displayName, name });
      setChecker({ checkedName: name });
    } else if (isValid) {
      setChecker({ checkingName: false });
    }
  }, [group, editGroup]);

  if (!initialized.current) {
    initialized.current = true;
  }
  
  useEffect(() => {
    if (initialized.current && editGroup && debouncedName !== editGroup.name) {
      setSkipQuery(false);
    } else if (!initialized.current) {
      initialized.current = true;
    }
  }, [debouncedName, editGroup]);

  return <>
    <Card>
      <CardHeader title={(editGroup ? 'Manage' : 'Create') + ' Group'}></CardHeader>
      <CardContent>
        {!!children && children}

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="name"
              label="Group Name"
              value={group.displayName}
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
                      setSnack({ snackType: 'info', snackOn: 'Must be an email domain, like DOMAIN.COM' })
                    } else {
                      setAllowedDomains([...allowedDomains, allowedDomain])
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
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            disabled={!editGroup && (group.purpose.length < 25 || !isValid || checkingName || badName)}
            onClick={handleSubmit}
          >
            {group.id ? 'Edit' : 'Create'} Group
          </Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageGroupModal;