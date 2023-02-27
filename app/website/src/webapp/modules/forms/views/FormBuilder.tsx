import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { IField, IFormVersion } from 'awayto';

const fieldSchema = {
  name: '',
  value: '',
  helperText: '',
  type: '',
  defaultValue: '',
  required: false
}

export type FormBuilderProps = {
  version?: IFormVersion;
  setVersion?(value: IFormVersion): void;
};

declare global {
  interface IProps extends FormBuilderProps { }
}

export default function FormBuilder({ version, setVersion }: IProps & Required<FormBuilderProps>) {

  const [rows, setRows] = useState({} as Record<string, IField[]>);

  const rowKeys = useMemo(() => Object.keys(rows), [rows]);

  const addRow = useCallback(() => setRows({ ...rows, [`${Object.keys(rows).length + 1}`]: [makeField()] }), [rows]);

  const delRow = useCallback((row: string) => {
    delete rows[row];
    setRows({ ...rows });
  }, [rows]);

  const addCol = useCallback((row: string) => setRows({ ...rows, [row]: Array.prototype.concat(rows[row], [makeField()]) }), [rows]);

  const delCol = useCallback((row: string, col: number) => {
    rows[row].splice(col);
    if (!rows[row].length) delete rows[row];
    setRows({ ...rows });
  }, [rows]);

  const makeField = useCallback((): IField => {
    const id = (new Date()).getTime().toString();
    return { id, ...fieldSchema }
  }, []);

  // const fieldCell = useCallback((row: number, col: number) => {
  //   const cell = rows[row][col];
  //   return <Grid container>
  //     <Grid item xs={6}>
  //       <TextField
  //         fullWidth
  //         select
  //         label="Field Type"
  //         value={cell.type}
  //         onChange={e => {
  //           setRows({ ...rows, [row]: { ...rows[row], } })
  //         }}
  //       >
  //         <MenuItem key={1111} value={'text'}>Text</MenuItem>
  //         <MenuItem key={1234} value={'email'}>E-Mail</MenuItem>
  //         <MenuItem key={23432423} value={'date'}>Date</MenuItem>
  //         <MenuItem key={235325} value={'time'}>Time</MenuItem>
  //       </TextField>
  //     </Grid>
  //     <Grid item xs={6}>
  //       <TextField
  //         fullWidth
  //         label={cell.name}
  //         type={cell.type}
  //         value={cell.value}
  //       />
  //     </Grid>

  //   </Grid>
  // }, [rows]);

  return <>

    {!!rowKeys.length && <Box mb={4}>
      <Grid container>
        {rowKeys.map((rowId, i) => <Grid key={`form_fields_row_${i}`} item xs={12}>
          <Grid container>
            <Grid item xs={10}>
              <Grid container>
                {rows[rowId].map((col, j) => {
                  return <Grid key={`form_fields_cell_${i + 1}_${j + 1}`} item xs={12 / rows[rowId].length}>

                    <TextField
                      type="text"
                      InputProps={{
                        endAdornment: <Button onClick={() => delCol(rowId, j)}>del</Button>
                      }}
                    />

                  </Grid>
                })}
              </Grid>
            </Grid>
            <Grid item xs={2}>
              <Grid container direction="column">
                <CardActionArea sx={{ display: 'flex', flex: '1' }} onClick={() => addCol(rowId)}>+ col</CardActionArea>
                <CardActionArea sx={{ display: 'flex' }} onClick={() => delRow(rowId)}>- row</CardActionArea>
              </Grid>
            </Grid>
          </Grid>
        </Grid>)}
      </Grid>

    </Box>}
    <Button onClick={addRow}>Add Row</Button>
  </>;
}