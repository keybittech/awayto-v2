import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import SettingsIcon from '@mui/icons-material/Settings';

// text

// Single line text input.

// textarea

// Multiple line text input.

// textarea

// select

// Common single select input. See description how to configure options below.

// select

// select-radiobuttons

// Single select input through group of radio buttons. See description how to configure options below.

// group of input

// multiselect

// Common multiselect input. See description how to configure options below.

// select

// multiselect-checkboxes

// Multiselect input through group of checkboxes. See description how to configure options below.

// group of input

// html5-email

// Single line text input for email address based on HTML 5 spec.

// html5-tel

// Single line text input for phone number based on HTML 5 spec.

// html5-url

// Single line text input for URL based on HTML 5 spec.

// html5-number

// Single line input for number (integer or float depending on step) based on HTML 5 spec.

// html5-range

// Slider for number entering based on HTML 5 spec.

// html5-datetime-local

// Date Time input based on HTML 5 spec.

// html5-date

// Date input based on HTML 5 spec.

// html5-month

// Month input based on HTML 5 spec.

// html5-week

// Week input based on HTML 5 spec.

// html5-time

// Time input based on HTML 5 spec.




import { IField, IFormVersion, deepClone } from 'awayto/core';

import { useComponents } from 'awayto/hooks';

export type FormBuilderProps = {
  version?: IFormVersion;
  setVersion?(value: IFormVersion): void;
  editable?: boolean;
};

declare global {
  interface IProps extends FormBuilderProps { }
}

export default function FormBuilder({ version, setVersion, editable = true }: IProps & Required<FormBuilderProps>): React.JSX.Element {

  const { Field } = useComponents();

  const [rows, setRows] = useState({} as Record<string, IField[]>);
  const [cell, setCell] = useState({} as IField);
  const [position, setPosition] = useState({ row: '', col: 0 });

  useEffect(() => {
    if (Object.keys(rows).length) {
      setVersion({ ...version, form: rows });
    }
  }, [rows]);

  useEffect(() => {
    if (Object.keys(version.form).length) {
      setRows({ ...version.form });
    }
  }, [version]);

  const rowKeys = useMemo(() => Object.keys(rows), [rows]);

  const addRow = useCallback(() => setRows({ ...rows, [(new Date()).getTime().toString()]: [makeField()] }), [rows]);

  // const delRow = useCallback((row: string) => {
  //   delete rows[row];
  //   setRows({ ...rows });
  // }, [rows]);

  const addCol = useCallback((row: string) => setRows({ ...rows, [row]: Array.prototype.concat(rows[row], [makeField()]) }), [rows]);

  const delCol = useCallback((row: string, col: number) => {
    rows[row].splice(col, 1);
    if (!rows[row].length) delete rows[row];
    setRows({ ...rows });
  }, [rows]);

  const makeField = useCallback((): IField => ({ l: '', t: 'text', h: '', r: false, v: '', x: '' }), []);

  const setCellAttr = useCallback((value: string, attr: string) => {
    if (cell && Object.keys(cell).length) {
      const newCell = {
        ...cell,
        [attr]: value
      };

      setCell(newCell);
      setRows((oldRows) => {
        if (oldRows && position && position.row !== undefined && position.col !== undefined) {
          const newRows = deepClone(oldRows);
          if (newRows[position.row] && newRows[position.row][position.col]) {
            newRows[position.row][position.col] = newCell;
          }
          return newRows;
        }
        return oldRows;
      });
    }
  }, [rows, cell]);

  const CurrentLabelInput = useCallback(() => <Grid item>
    <TextField fullWidth autoFocus id={`row_${position.row}_col_${position.col}_label_input`} label="Label" type="text" helperText="Required." value={cell.l} onChange={e => setCellAttr(e.target.value, 'l')} />
  </Grid>, [cell]);

  return <Grid container spacing={2}>

    <Grid item sx={{ display: 'flex', flex: 1, alignItems: 'start' }}>
      <Grid container spacing={2}>
        {Object.keys(rows).length < 3 && <Grid item xs={12}>
          <Button variant="outlined" fullWidth onClick={addRow}>add row</Button>
        </Grid>}
        {Object.keys(rows).length > 0 && <Grid item xs={12}>
          <Typography variant="subtitle1">Add a field. Give it a label. Any example values shown on this screen are for display purposes only while editing.</Typography>
        </Grid>}
        {rowKeys.map((rowId, i) => <Grid key={`form_fields_row_${i}`} item xs={12}>
          <Grid container spacing={2}>
            {rows[rowId].length < 3 && <Grid item xs={12} md={2}>
              <Grid container direction="column" sx={{ placeItems: 'center', height: '100%' }}>
                <Button fullWidth variant="outlined" color="warning" sx={{ display: 'flex', flex: 1 }} onClick={() => addCol(rowId)}>add column</Button>
                {/* <ButtonBase sx={{ display: 'flex', padding: '2px', backgroundColor: 'rgba(255, 0, 0, .1)' }} onClick={() => delRow(rowId)}>- row</ButtonBase> */}
              </Grid>
            </Grid>}
            <Grid item xs={12} md={rows[rowId].length < 3 ? 10 : 12}>
              <Grid container spacing={2}>
                {rows[rowId].map((field, j) => {
                  return <Grid item xs={12 / rows[rowId].length} key={`form_fields_cell_${i + 1}_${j}`}>
                    <Field
                      defaultDisplay
                      field={field}
                      endAdornment={
                        <IconButton sx={{  color: position.row == rowId && position.col == j ? 'secondary' : 'inherit'}} onClick={() => {
                          setCell(field);
                          setPosition({ row: rowId, col: j })
                        }}>
                          <SettingsIcon />
                        </IconButton>
                      }
                    />
                  </Grid>
                })}
              </Grid>
            </Grid>
          </Grid>
        </Grid>)}
      </Grid>
    </Grid>

    {editable && Object.hasOwn(cell, 'l') && <Grid item>
      <Divider orientation="vertical" />
    </Grid>}

    {editable && Object.hasOwn(cell, 'l') && <Grid item xs={4}>
      <Grid container spacing={2} direction="column">

        <Grid item>
          <Grid container alignItems="center">
            <Grid item sx={{ display: 'flex', flex: 1 }}>
              <Typography variant="body2">Field Attributes</Typography>
            </Grid>
            <Grid item>
              <Button variant="text" onClick={() => {
                setPosition({ row: '', col: 0 })
                setCell({} as IField);
              }}>X</Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item>
          <Button fullWidth color="error" onClick={() => {
            setPosition({ row: '', col: 0 })
            delCol(position.row, position.col);
            setCell({} as IField);
          }}>Delete</Button>
        </Grid>

        <CurrentLabelInput />

        {'labelntext' === cell.t && <Grid item>
          <TextField fullWidth label="Text" type="text" value={cell.x} onChange={e => setCellAttr(e.target.value, 'x')} />
        </Grid>}

        <Grid item>
          <TextField
            fullWidth
            select
            label="Field Type"
            value={cell.t}
            onChange={e => setCellAttr(e.target.value, 't')}
          >
            <MenuItem key={1111} value={'text'}>Textfield</MenuItem>
            <MenuItem key={23432423} value={'date'}>Date</MenuItem>
            <MenuItem key={235325} value={'time'}>Time</MenuItem>
            <MenuItem key={235324325} value={'labelntext'}>Label and Text</MenuItem>
          </TextField>
        </Grid>

        <Grid item>
          <TextField fullWidth label="Helper Text" type="text" value={cell.h} onChange={e => setCellAttr(e.target.value, 'h')} />
        </Grid>

        <Grid item>
          <TextField fullWidth label="Default Value" type={cell.t} value={cell.v} onChange={e => setCellAttr(e.target.value, 'v')} />
        </Grid>

        <Grid item>
          <Typography variant="body1">Required</Typography>
          <Switch value={cell.r} checked={cell.r} onChange={() => {
            rows[position.row][position.col].r = !cell.r;
            setRows({ ...rows })
          }} />
        </Grid>

      </Grid>
    </Grid>}

  </Grid>;
}