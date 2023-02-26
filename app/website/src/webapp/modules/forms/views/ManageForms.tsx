import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useParams } from 'react-router';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IGroupForm, IActionTypes } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageFormModal from './ManageFormModal';

export type ManageFormsActions = {
  groupForms?: Record<string, IGroupForm>;
  getGroupFormsAction?: IActionTypes;
  putGroupFormsAction?: IActionTypes;
  postGroupFormsAction?: IActionTypes;
  deleteGroupFormsAction?: IActionTypes;
};

declare global {
  interface IProps extends ManageFormsActions { }
}

export function ManageForms(props: IProps): JSX.Element {
  const { groupForms, getGroupFormsAction, deleteGroupFormsAction } = props as IProps & Required<ManageFormsActions>;

  const { groupName } = useParams();
  const api = useApi();
  const util = useRedux(state => state.util);
  const [form, setForm] = useState<IGroupForm>();
  const [selected, setSelected] = useState<IGroupForm[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: IGroupForm[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Name', selector: row => row.name },
    { name: 'Created', selector: row => row.createdOn }
  ] as TableColumn<IGroupForm>[], [])

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <IconButton key={'manage_form'} onClick={() => {
        setForm(selected.pop());
        setDialog('manage_form');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={() => {
        const [, res] = api(deleteGroupFormsAction, { ids: selected.map(s => s.id).join(',') }, { load: true })
        res?.then(() => {
          setToggle(!toggle);
          api(getGroupFormsAction);
        }).catch(console.warn);
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected])

  useEffect(() => {
    if (groupName) {
      const [abort, res] = api(getGroupFormsAction, { groupName });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName]);

  return <>
    <Dialog open={dialog === 'manage_form'} fullWidth maxWidth="sm">
      <ManageFormModal {...props} editForm={form} closeModal={() => {
        setDialog('')
        api(getGroupFormsAction, { groupName });
      }} />
    </Dialog>

    <Card>
      <CardContent>

        <DataTable
          title="Forms"
          actions={<Button onClick={() => { setForm(undefined); setDialog('manage_form') }}>New</Button>}
          contextActions={actions}
          data={groupForms ? Object.values(groupForms) : []}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          theme={util.theme}
          columns={columns}
          selectableRows
          selectableRowsHighlight={true}
          // selectableRowsComponent={<Checkbox />}
          onSelectedRowsChange={updateState}
          clearSelectedRows={toggle}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </>
}

export default ManageForms;