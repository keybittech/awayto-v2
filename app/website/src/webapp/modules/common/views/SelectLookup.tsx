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

import { ILookup, IActionTypes, IFormActionTypes, IUtilActionTypes } from 'awayto';
import { useApi, useAct } from 'awayto-hooks';

declare global {
  interface IProps {
    multiple?: boolean;
    noEmptyValue?: boolean;
    lookups?: ILookup[];
    lookupName?: string;
    helperText?: string;
    lookupChange?(value: string | string[]): void;
    lookupValue?: string | string[];
    defaultValue?: string | string[];
    createAction?: IActionTypes;
    deleteAction?: IActionTypes;
    refetchAction?: IActionTypes;
    parentUuidName?: string;
    parentUuid?: string;
    attachAction?: IActionTypes;
    attachName?: string;
  }
}

const { SET_SNACK } = IUtilActionTypes;

function isStringArray(str?: string | string[]): str is string[] {
  return (str as string[]).forEach !== undefined;
}

export function SelectLookup({ lookupChange, defaultValue, attachAction, attachName, refetchAction, parentUuidName, parentUuid, lookups, lookupName, helperText, lookupValue, multiple = false, noEmptyValue = false, createAction, deleteAction }: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const [addingNew, setAddingNew] = useState<boolean | undefined>();
  const [newLookup, setNewLookup] = useState<ILookup>({ name: '' });
  const [lookupUpdater, setLookupUpdater] = useState(null as unknown as string);

  if (!lookupName || !lookupChange) return <Grid container justifyContent="center"><CircularProgress /></Grid>;

  const refresh = () => {
    setAddingNew(false);
    setNewLookup({ name: '' })

    if (refetchAction) {
      api(refetchAction, true, parentUuidName && parentUuid ? { [parentUuidName]: parentUuid } : {});
    }
  }

  const handleSubmit = useCallback(() => {
    setLookupUpdater(newLookup.name);
    if (createAction) {
      const [, res] = api(createAction, true, newLookup);

      res?.then(lookup => {
        const [{ id: lookupId }] = lookup as ILookup[];
        if (attachAction && lookupId && parentUuid && parentUuidName && attachName) {
          const [, rez] = api(attachAction, true, { [parentUuidName]: parentUuid, [attachName]: lookupId })
          rez?.then(() => refresh());
        } else {
          refresh();
        }
      })
    }
  }, [newLookup, createAction, attachAction, attachName, parentUuid, parentUuidName])

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

  useEffect(() => {
    if (defaultValue) {
      lookupChange(defaultValue);
    }
  }, [defaultValue]);

  return (addingNew ?
    <TextField
      autoFocus
      fullWidth
      label={`New ${lookupName}`}
      value={newLookup.name}
      onChange={e => {
        setNewLookup({ name: e.target.value })
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
                newLookup.name ? handleSubmit() : void act(SET_SNACK, { snackOn: 'Provide a name for the record.', snackType: 'info' });
              }}>
                <CheckIcon style={{ color: 'green' }} />
              </IconButton>
            </Box>
          </InputAdornment>
        ),
      }}
    /> : <TextField
      select
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
            const actionIdentifier = deleteAction.substring(deleteAction.lastIndexOf(':')+1, deleteAction.length);
            const [, res] = api(deleteAction, true, parentUuidName && attachName ? { [parentUuidName]: parentUuid, [attachName]: lookup.id } : { [actionIdentifier]: lookup.id });
            res?.then(() => {
              if (refetchAction) {
                api(refetchAction, true, parentUuidName && parentUuid ? { [parentUuidName]: parentUuid } : {});
              }
            });
          }} />}
        </MenuItem>
      )) : []}
    </TextField>
  )
}

export default SelectLookup;

