import React, { useState } from 'react';
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
  }
}

const { GET_FORMS } = IFormActionTypes;
const { SET_SNACK } = IUtilActionTypes;

function isStringArray(str?: string | string[]): str is string[] {
  return (str as string[]).forEach !== undefined;
}

export function SelectLookup({ lookups, lookupName, helperText, lookupValue, lookupChange, multiple = false, createActionType, deleteActionType }: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const [addingNew, setAddingNew] = useState<boolean | undefined>();
  const [newLookup, setNewLookup] = useState<ILookup>({ name: '' });

  if (!lookups || !lookupName || !lookupChange) return <Grid container justifyContent="center"><CircularProgress /></Grid>;

  return (addingNew ?
    <TextField fullWidth label={`New ${lookupName}`} value={newLookup.name} onChange={e => setNewLookup({ name: e.target.value })} InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <Box mb={2}>
            <IconButton aria-label="close new record" onClick={() => setAddingNew(false)}>
              <ClearIcon style={{ color: 'red' }} />
            </IconButton>
            <IconButton aria-label="create new record" onClick={() => {
              if (createActionType && newLookup.name) {
                void api(createActionType, true, newLookup).then(() => {
                  void api(GET_FORMS);
                  setAddingNew(false);
                  setNewLookup({ name: '' })
                });
              } else {
                void act(SET_SNACK, { snackOn: 'Provide a name for the record.', snackType: 'info' });
              }
            }}>
              <CheckIcon style={{ color: 'green' }} />
            </IconButton>
          </Box>
        </InputAdornment>
      ),
    }} /> : <TextField
      select
      id={`${lookupName}-lookup-selection`}
      fullWidth
      helperText={helperText || ''}
      label={`${lookupName}s`}
      onChange={e => {
        const { value } = e.target as { value: string | string[] };
        console.log({ value })
        if (isStringArray(value) && value.indexOf('new') > -1) {
        } else {
          lookupChange(value);
        }
      }}
      value={lookupValue}
      SelectProps={{
        multiple,
        renderValue: selected => isStringArray(selected as string | string[]) ? (selected as string[]).join(', ') : selected as string
      }}
      
    >
      {!multiple && <MenuItem value="">No selection</MenuItem>}
      {createActionType && <MenuItem value="new" onClick={e => {
        e.preventDefault();
        setAddingNew(true);
      }}>Add a {lookupName} to this list</MenuItem>}
      {lookups.length ? lookups.map((p, i) => (
        <MenuItem key={i} style={{ display: 'flex' }} value={p.name}>
          <span style={{ flex: '1' }}>{p.name}</span>
          {deleteActionType && <ClearIcon style={{ color: 'red', marginRight: '8px' }} onClick={e => {
            e.stopPropagation();
            void api(deleteActionType, true, { id: p.id }).then(() => {
              void api(GET_FORMS);
            });
          }} />}
        </MenuItem>
      )) : []}
    </TextField>
  )
}

export default SelectLookup;

