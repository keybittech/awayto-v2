import React, { useCallback, useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';

import { ILookup } from 'awayto/core';
import { MutationTrigger, SiteMutation, useUtil } from 'awayto/hooks';

declare global {
  interface IProps {
    multiple?: boolean;
    disabled?: boolean;
    noEmptyValue?: boolean;
    lookups?: ILookup[];
    lookupName?: string;
    helperText?: string;
    lookupChange?(value: string | string[]): void;
    lookupValue?: string | string[];
    defaultValue?: string | string[];
    invalidValues?: string[];
    refetchAction?: (props?: { [prop: string]: string }) => void;
    attachAction?: MutationTrigger<SiteMutation<{ [prop: string]: string }, ILookup>>;
    createAction?: MutationTrigger<SiteMutation<{ readonly name: string; }, ILookup>>;
    deleteAction?: MutationTrigger<SiteMutation<{ [prop: string]: string }, ILookup[]>>;
    parentUuidName?: string;
    parentUuid?: string;
    attachName?: string;
    deleteActionIdentifier?: string
  }
}

function isStringArray(str?: string | string[]): str is string[] {
  return (str as string[]).forEach !== undefined;
}

export function SelectLookup({ lookupChange, disabled = false, invalidValues = [], attachAction, attachName, refetchAction, parentUuidName, parentUuid, lookups, lookupName, helperText, lookupValue, multiple = false, noEmptyValue = false, createAction, deleteAction, deleteActionIdentifier }: IProps): JSX.Element {
  
  const { setSnack } = useUtil();

  const [addingNew, setAddingNew] = useState<boolean | undefined>();
  const [newLookup, setNewLookup] = useState({ name: '' } as ILookup);
  const [lookupUpdater, setLookupUpdater] = useState(null as unknown as string);

  if (!lookupName || !lookupChange) return <Grid container justifyContent="center"><CircularProgress /></Grid>;

  const refresh = () => {
    setAddingNew(false);
    setNewLookup({ name: '' } as ILookup)

    if (refetchAction && parentUuidName && parentUuid) {
      refetchAction({ [parentUuidName]: parentUuid });
    }
  }

  const handleSubmit = useCallback(() => {
    if (invalidValues.includes(newLookup.name)) {
      setSnack({ snackType: 'warning', snackOn: 'That value cannot be used here.' })
      return;
    }

    setLookupUpdater(newLookup.name);
    if (createAction) {
      createAction({ name: newLookup.name }).unwrap().then(res => {
        const { id: lookupId } = res;
        if (attachAction && lookupId && parentUuid && parentUuidName && attachName) {
          attachAction({ [parentUuidName]: parentUuid, [attachName]: lookupId }).unwrap().then(() => refresh());
        } else {
          refresh();
        }
      });
    }
  }, [newLookup, createAction, attachAction, attachName, parentUuid, parentUuidName]);

  useEffect(() => {
    if (lookups?.length && isStringArray(lookupValue) && lookupUpdater) {
      const updater = lookups.find(l => l.name === lookupUpdater);
      if (updater?.id) {
        lookupChange([ ...lookupValue, updater.id ]);
        setLookupUpdater('');
      }
    }
  }, [lookups, lookupValue, lookupUpdater]);

  useEffect(() => {
    if (lookups && lookups?.length && noEmptyValue && !lookupValue?.length) {
      const firstLookup = lookups.at(0) as Required<ILookup>;
      lookupChange(isStringArray(lookupValue) ? [firstLookup.id] : firstLookup.id);
    }
  }, [lookups, lookupValue, noEmptyValue]);

  // useEffect(() => {
  //   if (defaultValue && !lookupValue) {
  //     lookupChange(defaultValue);
  //   }
  // }, [defaultValue, lookupValue]);

  return (addingNew ?
    <TextField
      autoFocus
      fullWidth
      label={`New ${lookupName}`}
      value={newLookup.name}
      onChange={e => {
        setNewLookup({ name: e.target.value } as ILookup)
      }}
      onKeyDown={(e) => {
        ('Enter' === e.key && newLookup.name) && handleSubmit();
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Box mb={2}>
              <IconButton aria-label="close new record" onClick={() => {
                setAddingNew(false);
                setNewLookup({ ...newLookup, name: '' });
              }}>
                <ClearIcon style={{ color: 'red' }} />
              </IconButton>
              <IconButton aria-label="create new record" onClick={() => {
                newLookup.name ? handleSubmit() : void setSnack({ snackOn: 'Provide a name for the record.', snackType: 'info' });
              }}>
                <CheckIcon style={{ color: 'green' }} />
              </IconButton>
            </Box>
          </InputAdornment>
        ),
      }}
    /> : <TextField
      select
      disabled={disabled}
      autoFocus={!!lookupUpdater}
      id={`${lookupName}-lookup-selection`}
      fullWidth
      helperText={helperText || ''}
      label={`${lookupName}s`}
      onChange={e => {
        const { value } = e.target as { value: string | string[] };
        if (isStringArray(value) && value.indexOf('new') > -1) {
        } else {
          lookupChange(value);
        }
      }}
      value={lookupValue}
      SelectProps={{
        multiple,
        renderValue: selected => {
          if (isStringArray(selected as string[])) 
            return (selected as string[]).map(v => lookups?.find(r => r.id === v)?.name ).join(', ')
          
          return lookups?.find(r => r.id === selected)?.name as string
        }
      }}
      
    >
      {!multiple && !noEmptyValue && <MenuItem value="">No selection</MenuItem>}
      {createAction && <MenuItem value="new" onClick={e => {
        e.preventDefault();
        setAddingNew(true);
      }}>Add a {lookupName} to this list</MenuItem>}
      {!lookups?.length && <MenuItem disabled>You have no pre-defined {lookupName}s.<br /> Click the button above to add some.</MenuItem>}
      {lookups?.length ? lookups.map((lookup, i) => (
        <MenuItem key={i} style={{ display: 'flex' }} value={lookup.id}>
          <span style={{ flex: '1' }}>{lookup.name}</span>
          {refetchAction && deleteAction && <ClearIcon style={{ color: 'red', marginRight: '8px' }} onClick={e => {
            e.stopPropagation();
            if (isStringArray(lookupValue) && lookup.id) {
              lookupChange([...lookupValue.filter(l => l !== lookup.id)]);
            } else if (lookupValue === lookup.id) {
              lookupChange('');
            }

            if (parentUuidName && parentUuid && attachName) {
              deleteAction({ [parentUuidName]: parentUuid, [attachName]: lookup.id }).unwrap().then(() => refresh());
            }

            if (deleteActionIdentifier) {
              deleteAction({ [deleteActionIdentifier]: lookup.id }).unwrap().then(() => refresh());
            }

          }} />}
        </MenuItem>
      )) : []}
    </TextField>
  )
}

export default SelectLookup;

