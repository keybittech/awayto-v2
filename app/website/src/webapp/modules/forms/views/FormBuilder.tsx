import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { IField, IFormVersion } from 'awayto';

import Field from './Field';

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
    rows[position.row][position.col][attr] = value;
    setRows({ ...rows })
  }, [rows, position]);

  return <Grid container spacing={2}>

    <Grid item sx={{ display: 'flex', flex: 1, alignItems: 'start' }}>
      <Grid container spacing={2}>
        {Object.keys(rows).length < 3 && <Grid item xs={12}>
          <Button variant="outlined" fullWidth onClick={addRow}>add row</Button>
        </Grid>}
        {Object.keys(rows).length > 0 && <Grid item xs={12}>
          <Typography variant="subtitle1">Start by editing the field and adding a label.</Typography>
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
                    <ButtonBase
                      sx={{
                        width: '100%',
                        backgroundColor: position.row === rowId && position.col === j ? 'rgba(0, 150, 200, .1)' : 'rgba(0, 0, 0, .1)',
                        cursor: 'pointer !important'
                      }}
                      onClick={() => {
                        setCell(field);
                        setPosition({ row: rowId, col: j })
                      }}
                    >
                      <Field field={field} />
                    </ButtonBase>
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

        <Grid item>
          <TextField fullWidth label="Label" type="text" helperText="Required." value={cell.l} onChange={e => setCellAttr(e.target.value, 'l')} />
        </Grid>

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