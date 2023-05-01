import React, { useState, useMemo, Suspense } from 'react';
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

import { DataGrid } from '@mui/x-data-grid';

import { IGroupForm } from 'awayto/core';
import { sh, useGrid, useStyles } from 'awayto/hooks';

import ManageFormModal from './ManageFormModal';

export function ManageForms(props: IProps): JSX.Element {
  const classes = useStyles();

  const { groupName } = useParams();
  if (!groupName) return <></>;
  
  const [deleteGroupForm] = sh.useDeleteGroupFormMutation();
  const { data: groupForms, refetch: getGroupForms } = sh.useGetGroupFormsQuery({ groupName });

  const [form, setForm] = useState<IGroupForm>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_form'} title="Edit">
        <Button onClick={() => {
          setForm(groupForms?.find(gf => gf.id === selected[0]));
          setDialog('manage_form');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip> 
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete">
        <Button onClick={() => {
          if (selected.length) {
            deleteGroupForm({ groupName, ids: selected.join(',') }).unwrap().then(() => {
              setSelected([]);
              void getGroupForms();
            }).catch(console.error);
          }
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  const formGridProps = useGrid<IGroupForm>({
    rows: groupForms || [],
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
          <NoteAddIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  return <>
    <Dialog fullScreen open={dialog === 'manage_form'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageFormModal {...props} editForm={form} closeModal={() => {
          setDialog('')
          void getGroupForms();
        }} />
      </Suspense>
    </Dialog>

    <DataGrid {...formGridProps} />

  </>
}

export default ManageForms;