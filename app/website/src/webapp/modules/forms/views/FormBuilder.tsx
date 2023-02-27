import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { IField, IFormVersion } from 'awayto';
import { Typography } from '@mui/material';

export type FormBuilderProps = {
  version?: IFormVersion;
  setVersion?(value: IFormVersion): void;
  editable?: boolean;
};

declare global {
  interface IProps extends FormBuilderProps { }
}

export default function FormBuilder({ version, setVersion, editable = true }: IProps & Required<FormBuilderProps>): JSX.Element {

  const [rows, setRows] = useState({} as Record<string, IField[]>);
  const [cell, setCell] = useState({} as IField);
  const [position, setPosition] = useState({ row: '', col: 0 });

  useEffect(() => {
    if (Object.keys(rows).length) {
      setVersion({ ...version, form: rows });
    } else if (Object.keys(version.form).length) {
      setRows({ ...version.form });
    }
  }, [version, rows]);

  const rowKeys = useMemo(() => Object.keys(rows), [rows]);

  const addRow = useCallback(() => setRows({ ...rows, [`${Object.keys(rows).length + 1}`]: [makeField()] }), [rows]);

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

  const makeField = useCallback((): IField => ({ l: '', t: '', h: '', r: false }), []);

  const setCellAttr = useCallback((value: string, attr: string) => {
    rows[position.row][position.col][attr] = value;
    setRows({ ...rows })
  }, [rows, position]);

  return <Grid container spacing={2}>

    <Grid item sx={{ display: 'flex', flex: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {Object.keys(rows).length < 3 && <Button fullWidth onClick={addRow}>add row</Button>}
          {Object.keys(rows).length > 0 && <Typography variant="caption">Click on a field to edit it. All fields must have a label.</Typography>}
        </Grid>
        {rowKeys.map((rowId, i) => <Grid key={`form_fields_row_${i}`} item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={rows[rowId].length < 3 ? 10 : 12}>
              <Grid container spacing={2}>
                {rows[rowId].map((cell, j) => {
                  return <Grid key={`form_fields_cell_${i + 1}_${j}`} item xs={12 / rows[rowId].length}>
                    <TextField
                      fullWidth
                      label={cell.l || 'Click to edit.'}
                      type={cell.t || 'text'}
                      helperText={`${cell.r ? 'Required. ' : ''}${cell.h || ''}`}
                      onFocus={() => {
                        setCell(cell);
                        setPosition({ row: rowId, col: j });
                      }}
                      InputProps={{
                        endAdornment: <Button variant="text" onClick={() => {
                          delCol(rowId, j);
                          setCell({} as IField);
                        }}>x</Button>
                      }}
                    />
                  </Grid>
                })}
              </Grid>
            </Grid>
            {rows[rowId].length < 3 && <Grid item xs={2}>
              <Grid container direction="column" sx={{ placeItems: 'center', height: '100%' }}>
                <Button fullWidth variant="contained" color="secondary" sx={{ display: 'flex', flex: 1 }} onClick={() => addCol(rowId)}>add column</Button>
                {/* <CardActionArea sx={{ display: 'flex', padding: '2px', backgroundColor: 'rgba(255, 0, 0, .1)' }} onClick={() => delRow(rowId)}>- row</CardActionArea> */}
              </Grid>
            </Grid>}
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
                setCell({} as IField);
              }}>X</Button>
            </Grid>
          </Grid>


        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            select
            label="Field Type"
            value={cell.t}
            onChange={e => setCellAttr(e.target.value, 't')}
          >
            <MenuItem key={1111} value={'text'}>Text</MenuItem>
            <MenuItem key={1234} value={'email'}>E-Mail</MenuItem>
            <MenuItem key={23432423} value={'date'}>Date</MenuItem>
            <MenuItem key={235325} value={'time'}>Time</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={6}>
          <TextField fullWidth label="Label" type="text" value={cell.l} onChange={e => setCellAttr(e.target.value, 'l')} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Helper Text" type="text" value={cell.h} onChange={e => setCellAttr(e.target.value, 'h')} />
        </Grid>
        <Grid item xs={6}>
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