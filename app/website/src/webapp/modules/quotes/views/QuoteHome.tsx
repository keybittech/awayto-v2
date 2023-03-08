import React, { useEffect, useState, useCallback, useMemo } from "react";
import DataTable, { TableColumn } from 'react-data-table-component';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IQuoteActionTypes, IQuote, userTimezone } from "awayto";
import { useRedux, useApi } from "awayto-hooks";
import dayjs from "dayjs";

const { GET_QUOTES, DELETE_QUOTE } = IQuoteActionTypes;

function QuoteHome(props: IProps) {

  const api = useApi();
  const util = useRedux(state => state.util);
  const [selected, setSelected] = useState<IQuote[]>([]);
  const [toggle, setToggle] = useState(false);

  const { quotes } = useRedux(state => state.quote);
  const updateState = useCallback((state: { selectedRows: IQuote[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    { name: 'Requested Date', selector: row => row.slotDate },
    { name: 'Requested Time', selector: row => dayjs(row.slotDate).startOf('week').add(dayjs.duration(row.startTime)).format("hh:mm a") },
    { name: 'Requested On', selector: row => dayjs.utc(row.createdOn).local().format("YYYY-MM-DD hh:mm a") }
  ] as TableColumn<IQuote>[], []);

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [

    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={() => {
        const [, res] = api(DELETE_QUOTE, { ids: selected.map(s => s.id).join(',') }, { load: true })
        res?.then(() => {
          setToggle(!toggle);
          api(GET_QUOTES);
        }).catch(console.warn);
      }}>
        <DeleteIcon />
      </IconButton></Tooltip>
    ]
  }, [selected]);

  useEffect(() => {
    const [abort, res] = api(GET_QUOTES);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  return <Box mb={4}>
    <Card>
      <CardContent>

        <DataTable
          title="Pending Requests"
          contextActions={actions}
          data={quotes ? Object.values(quotes) : []}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          theme={util.theme}
          columns={columns}
          selectableRows
          selectableRowsHighlight={true}
          onSelectedRowsChange={updateState}
          clearSelectedRows={toggle}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </Box>
}

export default QuoteHome;