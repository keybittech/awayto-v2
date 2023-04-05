import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';

import { IGroupForm, IActionTypes } from 'awayto/core';
import { useApi, useGrid } from 'awayto/hooks';

import ManageFormModal from './ManageFormModal';

export type ManageFormsActions = {
  groupForms?: Record<string, IGroupForm>;
  getGroupFormsAction?: IActionTypes;
  getGroupFormByIdAction?: IActionTypes;
  putGroupFormsAction?: IActionTypes;
  postGroupFormsAction?: IActionTypes;
  postFormVersionAction?: IActionTypes;
  deleteGroupFormsAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageFormsActions { }
}

export function ManageForms(props: IProps): JSX.Element {
  const { groupForms, getGroupFormsAction, deleteGroupFormsAction } = props as IProps & Required<ManageFormsActions>;

  const { groupName } = useParams();
  const api = useApi();
  const [form, setForm] = useState<IGroupForm>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_form'} title="Edit">
        <Button onClick={() => {
          setForm(groupForms[selected[0]]);
          setDialog('manage_form');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip> 
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete">
        <Button onClick={() => {
          if (selected.length) {
            const [, res] = api(deleteGroupFormsAction, { groupName, ids: selected.join(',') }, { load: true })
            res?.then(() => {
              setSelected([]);
              api(getGroupFormsAction, { groupName });
            }).catch(console.warn);
          }
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  const FormGrid = useGrid<IGroupForm>({
    rows: Object.values(groupForms),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Forms:</Typography>
      <Tooltip key={'manage_form'} title="Create">
        <Button onClick={() => {
          setForm(undefined);
          setDialog('manage_form')
        }}
        >
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <NoteAddIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(getGroupFormsAction, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog fullScreen open={dialog === 'manage_form'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageFormModal {...props} editForm={form} closeModal={() => {
          setDialog('')
          api(getGroupFormsAction, { groupName });
        }} />
      </Suspense>
    </Dialog>

    <FormGrid />

  </>
}

export default ManageForms;