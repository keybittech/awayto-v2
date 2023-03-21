import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dayjs from 'dayjs';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IService, IActionTypes, IGroupService, IUtilActionTypes } from 'awayto';
import { useApi, useAct, useGrid } from 'awayto-hooks';

import ManageServiceModal from './ManageServiceModal';

const { OPEN_CONFIRM } = IUtilActionTypes;

export type ManageServicesActions = {
  services?: Map<string, IGroupService>;
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

  const act = useAct();
  const api = useApi();
  const [service, setService] = useState<IService>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');


  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_service'} onClick={() => {
        setService(services.get(selected[0]));
        setDialog('manage_service');
        setSelected([]);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_service'} title="Delete"><IconButton onClick={() => {
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
        <DeleteIcon />
      </IconButton></Tooltip>
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
    rows: Array.from(services.values()),
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={() => { setService(undefined); setDialog('manage_service') }}>New</Button>
      {!!selected.length && <Box sx={{ float: 'right' }}>{actions}</Box>}
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