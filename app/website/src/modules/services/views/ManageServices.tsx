import React, { useEffect, useState, useMemo, Suspense } from 'react';
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

import { IService, IActionTypes, IGroupService, IUtilActionTypes } from 'awayto/core';
import { useApi, useAct, useGrid } from 'awayto/hooks';

import ManageServiceModal from './ManageServiceModal';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageServicesActions = {
  services?: Record<string, IGroupService>;
  getServicesAction?: IActionTypes;
  postServicesAction?: IActionTypes;
  postGroupServicesAction?: IActionTypes;
  putServicesAction?: IActionTypes;
  disableServicesAction?: IActionTypes;
  deleteServicesAction?: IActionTypes;
  deleteGroupServicesAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageServicesActions { }
}

export function ManageServices(props: IProps): JSX.Element {
  const { services, getServicesAction, deleteGroupServicesAction } = props as IProps & Required<ManageServicesActions>;

  const { groupName } = useParams();

  const servicesValues = useMemo(() => Object.values(services), [services]);

  const act = useAct();
  const api = useApi();
  const navigate = useNavigate();
  const [service, setService] = useState<IService>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');


  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_service'} title="Edit">
        <Button onClick={() => {
          setService(services[selected[0]]);
          setDialog('manage_service');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_service'} title="Delete">
        <Button onClick={() => {
          if (groupName) {
            void act(OPEN_CONFIRM, {
              isConfirming: true,
              confirmEffect: 'Are you sure you want to delete these services? This cannot be undone.',
              confirmAction: () => {
                const [, res] = api(deleteGroupServicesAction, { groupName, ids: selected.join(',') }, { load: true })
                res?.then(() => {
                  api(getServicesAction, { groupName });
                  setSelected([]);
                }).catch(console.warn);
              }
            });
          }
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(getServicesAction, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  const ServiceGrid = useGrid({
    rows: servicesValues,
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
          <DomainAddIcon sx={{ fontSize: { xs: '24px', md: '12px' } }} />
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
          api(getServicesAction, { groupName });
        }} />
      </Suspense>
    </Dialog>
    <ServiceGrid />
  </>
}

export default ManageServices;