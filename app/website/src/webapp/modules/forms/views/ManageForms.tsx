import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IGroupForm, IActionTypes } from 'awayto';
import { useApi, useGrid } from 'awayto-hooks';

import ManageFormModal from './ManageFormModal';

export type ManageFormsActions = {
  groupForms?: Map<string, IGroupForm>;
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
      <IconButton key={'manage_form'} onClick={() => {
        setForm(groupForms.get(selected[0]));
        setDialog('manage_form');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={() => {
        if (selected.length) {
          const [, res] = api(deleteGroupFormsAction, { groupName, ids: selected.join(',') }, { load: true })
          res?.then(() => {
            setSelected([]);
            api(getGroupFormsAction, { groupName });
          }).catch(console.warn);
        }
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected]);

  const FormGrid = useGrid<IGroupForm>({
    rows: Array.from(groupForms.values()),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={() => { setForm(undefined); setDialog('manage_form') }}>New</Button>
      {!!selected.length && <Box sx={{ float: 'right' }}>{actions}</Box>}
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