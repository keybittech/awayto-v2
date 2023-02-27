import React, { useState } from "react";

import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IFormActionTypes, IForm, IUtilActionTypes, IFormVersion, IField } from "awayto";
import { useApi, useAct, useComponents } from 'awayto-hooks';
import { useCallback } from "react";
import { ManageFormsActions } from "./ManageForms";

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editForm?: IForm;
  }
}

export function ManageFormModal({ editForm, closeModal, ...props }: IProps): JSX.Element {
  const { putGroupFormsAction, postGroupFormsAction } = props as IProps & Required<ManageFormsActions>;

  const api = useApi();
  const act = useAct();
  const { FormBuilder } = useComponents();
  const [version, setVersion] = useState({ form: { fields: {} } } as IFormVersion);
  const [form, setForm] = useState({ name: '', ...editForm } as IForm);

  const handleSubmit = useCallback(() => {
    const { id, name } = form;

    if (!name || !Object.keys(version.form.fields).length) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'Forms must have a name, and at least 1 field.' });
      return;
    }

    // const [, res] = api(id ? putGroupFormsAction : postGroupFormsAction, form, { load: true });

    // res?.then(() => {
    //   if (closeModal)
    //     closeModal();
    // }).catch(console.warn);
    if (closeModal)     closeModal();
  }, [form, version.form.fields]);

  return <>
    <Card>
      <CardHeader title={editForm?.id ? 'Manage' : 'Create'} />
      <CardContent>
        <Box mt={2} />

        <Box mb={4}>
          <TextField
            fullWidth
            autoFocus
            id="name"
            label="Name"
            name="name"
            value={form.name}
            onKeyDown={e => {
              if ('Enter' === e.key) {
                handleSubmit();
              }
            }}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </Box>
        
        <FormBuilder {...props} version={version} setVersion={setVersion} />

      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageFormModal;