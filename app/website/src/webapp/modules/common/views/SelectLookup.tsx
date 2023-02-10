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
    lookups?: ILookup[];
    lookupName?: string;
    helperText?: string;
    lookupChange?(value: string | string[]): void;
    lookupValue?: string | string[];
    createActionType?: IActionTypes;
    deleteActionType?: IActionTypes;
    refetchAction?: IActionTypes;
  }
}

const { SET_SNACK } = IUtilActionTypes;

function isStringArray(str?: string | string[]): str is string[] {
  return (str as string[]).forEach !== undefined;
}

export function SelectLookup({ refetchAction, lookups, lookupName, helperText, lookupValue, lookupChange, multiple = false, createActionType, deleteActionType }: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const [addingNew, setAddingNew] = useState<boolean | undefined>();
  const [newLookup, setNewLookup] = useState<ILookup>({ name: '' });
  const [lookupUpdater, setLookupUpdater] = useState(null as unknown as string);

  if (!lookupName || !lookupChange) return <Grid container justifyContent="center"><CircularProgress /></Grid>;

  const handleSubmit = useCallback(() => {
    setLookupUpdater(newLookup.name);
    if (createActionType) {
      const [, response] = api(createActionType, true, newLookup);

      response?.then(() => {
        setAddingNew(false);
        setNewLookup({ name: '' })

        if (refetchAction) {
          api(refetchAction);
        }
      })
    }
  }, [lookupUpdater, createActionType, newLookup, refetchAction])

  useEffect(() => {
    if (lookups?.length && isStringArray(lookupValue) && lookupUpdater) {
      const updater = lookups.find(l => l.name === lookupUpdater);
      if (updater?.id) {
        lookupChange([ ...lookupValue, updater.id ]);
        setLookupUpdater('');
      }
    }
  }, [lookups, lookupValue, lookupUpdater])

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
      {!multiple && <MenuItem value="">No selection</MenuItem>}
      {createActionType && <MenuItem value="new" onClick={e => {
        e.preventDefault();
        setAddingNew(true);
      }}>Add a {lookupName} to this list</MenuItem>}
      {!lookups?.length && <MenuItem disabled>You have no pre-defined {lookupName}s.<br /> Click the button above to add some.</MenuItem>}
      {lookups?.length ? lookups.map((p, i) => (
        <MenuItem key={i} style={{ display: 'flex' }} value={p.id}>
          <span style={{ flex: '1' }}>{p.name}</span>
          {refetchAction && deleteActionType && <ClearIcon style={{ color: 'red', marginRight: '8px' }} onClick={e => {
            e.stopPropagation();
            const [, response] = api(deleteActionType, true, { id: p.id });
            response?.then(() => {
              if (refetchAction) {
                api(refetchAction);
              }
            });
          }} />}
        </MenuItem>
      )) : []}
    </TextField>
  )
}

export default SelectLookup;

