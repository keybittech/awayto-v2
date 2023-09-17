import React, { useEffect, useState, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IForm, IFormVersion, IField, IGroupForm, deepClone } from 'awayto/core';
import { useComponents, sh, useUtil } from 'awayto/hooks';

declare global {
  interface IProps {
    editForm?: IForm;
  }
}

export function ManageFormModal({ editForm, closeModal, ...props }: IProps): React.JSX.Element {

  const [postGroupFormVersion] = sh.usePostGroupFormVersionMutation();
  const [postGroupForm] = sh.usePostGroupFormMutation();
  const [getGroupFormById] = sh.useLazyGetGroupFormByIdQuery();

  const { setSnack } = useUtil();

  const { FormBuilder } = useComponents();
  const [version, setVersion] = useState({ form: {} } as IFormVersion);
  const [form, setForm] = useState({ name: '', ...editForm } as IForm);
  const [editable, setEditable] = useState(true);

  useEffect(() => {
    if (editForm) {
      getGroupFormById({ formId: editForm.id }).unwrap().then(res => {
        setForm(res);
        if (res.version) {
          setVersion(res.version);
        }
      }).catch(console.error);
    }
  }, [editForm]);

  useEffect(() => {
    const formClone = deepClone(form);
    if (formClone.version && Object.keys(formClone.version).length) {

      const vers = formClone.version;

      Object.keys(vers.form).forEach(k => {
        vers.form[k].forEach(f => {
          if (!f.t) f.t = 'text';
          if (!f.h) f.h = '';
          if (!f.r) f.r = false;
        });
      });

      setVersion(formClone.version);
    }
  }, [form]);

  const handleSubmit = useCallback(() => {
    setEditable(false);
    const { id, name } = form;

    if (!name || !Object.keys(version.form).length || Object.values(version.form).some(v => v.some(f => !f.l))) {
      setSnack({ snackType: 'error', snackOn: 'Forms must have a name, and at least 1 field. All fields must have a label.' });
      setEditable(true);
      return;
    }

    const newForm = Object.keys(version.form).reduce((m, k, i) => {
      const fields = [...version.form[k]] as IField[];
      return {
        ...m,
        [i]: fields.map(f => {
          delete f.v;
          if ('' === f.t) delete f.t;
          if ('' === f.h) delete f.h;
          if ('' === f.x) delete f.x;
          if (false === f.r) delete f.r;
          return f;
        })
      }
    }, {});

    const formVersion = {
      name,
      version: {
        form: newForm,
        formId: id
      }
    } as IForm;

    (id ? postGroupFormVersion : postGroupForm)((id ? { ...formVersion, formId: id } : { ...formVersion }) as IGroupForm).unwrap().then(() => closeModal && closeModal()).catch(console.error);
  }, [form, version.form]);

  return <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
    <CardHeader title={editForm?.id ? 'Manage' : 'Create'} />
    <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'auto' }}>
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

      <FormBuilder {...props} editable={editable} version={version} setVersion={setVersion} />

    </CardContent>
    <CardActions>
      <Grid container justifyContent="space-between">
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </Grid>
    </CardActions>
  </Card>
}

export default ManageFormModal;