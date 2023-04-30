import React, { useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import DomainAddIcon from '@mui/icons-material/DomainAdd';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { DataGrid } from '@mui/x-data-grid';

import { IService } from 'awayto/core';
import { useGrid, sh, useUtil, useStyles } from 'awayto/hooks';

import ManageServiceModal from './ManageServiceModal';

export function ManageServices(props: IProps): JSX.Element {
  const classes = useStyles();

  const { groupName } = useParams();
  if (!groupName) return <></>;

  const { openConfirm } = useUtil();

  const [deleteGroupService] = sh.useDeleteGroupServiceMutation();

  const { data: groupServices, refetch: getGroupServices } = sh.useGetGroupServicesQuery({ groupName });
  
  const navigate = useNavigate();
  const [service, setService] = useState<IService>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_service'} title="Edit">
        <Button onClick={() => {
          setService(groupServices?.find(gs => gs.id === selected[0]));
          setDialog('manage_service');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_service'} title="Delete">
        <Button onClick={() => {
          openConfirm({
            isConfirming: true,
            confirmEffect: 'Are you sure you want to delete these services? This cannot be undone.',
            confirmAction: () => {
              deleteGroupService({ groupName, ids: selected.join(',') }).unwrap().then(() => {
                void getGroupServices();
                setSelected([]);
              }).catch(console.error);
            }
          });
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  const serviceGridProps = useGrid({
    rows: groupServices || [],
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Services:</Typography>
      <Tooltip key={'create_service'} title="Create">
        <Button onClick={() => navigate('/service')}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <DomainAddIcon className={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  return <>
    <Dialog scroll="paper" open={dialog === 'manage_service'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageServiceModal {...props} editService={service} closeModal={() => {
          setDialog('')
          void getGroupServices();
        }} />
      </Suspense>
    </Dialog>
    <DataGrid {...serviceGridProps} />
  </>
}

export default ManageServices;