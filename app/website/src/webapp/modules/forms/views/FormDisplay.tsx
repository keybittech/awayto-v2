import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

import { IForm, IFormTemplate } from 'awayto';

export type FormDisplayProps = {
  form?: IForm;
  setForm?(value: IForm): void;
};

declare global {
  interface IProps extends FormDisplayProps { }
}

export default function FormDisplay({ form, setForm }: IProps & Required<FormDisplayProps>): JSX.Element {

  const [rows, setRows] = useState({} as IFormTemplate);
  const [formId, setFormId] = useState('');

  useEffect(() => {
    if (Object.keys(rows).length) {
      setForm({
        ...form,
        version: {
          ...form.version,
          submission: rows
        }
      });
    }
  }, [rows]);

  useEffect(() => {
    if (form.id !== formId && Object.keys(form.version.form).length) {
      setRows({ ...form.version.form });
      setFormId(form.id)
    }
  }, [form, formId]);

  const rowKeys = useMemo(() => Object.keys(rows), [rows]);

  const setCellAttr = useCallback((row: string, col: number, value: string, attr: string) => {
    rows[row][col][attr] = value;
    setRows({ ...rows })
  }, [rows]);

  return <>

    {rowKeys.map((rowId, i) => <Grid key={`form_fields_row_${i}`} item xs={12}>
      <Grid container spacing={2}>
        {rows[rowId].map((cell, j) => {
          return <Grid key={`form_fields_cell_${i + 1}_${j}`} item xs={12 / rows[rowId].length}>
            <TextField
              fullWidth
              label={cell.l}
              type={cell.t || 'text'}
              helperText={`${cell.r ? 'Required. ' : ''}${cell.h || ''}`}
              onChange={e => setCellAttr(rowId, j, e.target.value, 'v')}
            />
          </Grid>
        })}
      </Grid>
    </Grid>)}

  </>
}