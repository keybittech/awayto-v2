import React, { CSSProperties, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { IFormVersion } from 'awayto';

export type ScheduleDisplayProps = {
  version?: IFormVersion;
  setVersion?(value: IFormVersion): void;
};

declare global {
  interface IProps extends ScheduleDisplayProps { }
}

const bracketColors = ['cadetblue', 'brown', 'chocolate', 'forestgreen', 'darkslateblue', 'goldenrod', 'indianred', 'teal'];

export default function ScheduleDisplay({ version, setVersion }: IProps & Required<ScheduleDisplayProps>) {


  return <><Box mb={4}>

    <Button fullWidth onClick={() => {
      const id = (new Date()).getTime();
      const form = { ...version.form };
      form.fields = { ...form.fields, [id]: { id, name: '', type: '', value: '', defaultValue: '', helperText: '', required: false } };
      setVersion({ ...version, form });
    }}>Add Field</Button>
  </Box>
    {!!Object.keys(version.form.fields).length && <Box mb={4}>
      <Grid container>
        {Object.keys(version.form.fields).map((fieldId, i) => <Grid key={`form_field_${i}`} item xs={12}>
          <Grid container>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Field Type"
                value={version.form.fields[fieldId].type}
                onChange={e => {
                  const form = { ...version.form };
                  const field = { ...form.fields[fieldId] };
                  field.type = e.target.value;
                  form.fields = { ...form.fields, [fieldId]: field };
                  setVersion({ ...version, form });
                }}
              >
                <MenuItem key={1111} value={'text'}>Text</MenuItem>
                <MenuItem key={1234} value={'email'}>E-Mail</MenuItem>
                <MenuItem key={23432423} value={'date'}>Date</MenuItem>
                <MenuItem key={235325} value={'time'}>Time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={version.form.fields[fieldId].name}
                type={version.form.fields[fieldId].type}
                value={version.form.fields[fieldId].value}
              />
            </Grid>

          </Grid>
        </Grid>)}
      </Grid>

    </Box>}
  </>;
}