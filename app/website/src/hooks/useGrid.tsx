import React, { useMemo } from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel, GridValidRowModel } from '@mui/x-data-grid';

import Grid from '@mui/material/Grid';

type UseScheduleProps<T extends GridValidRowModel> = {
  rows: T[];
  columns: GridColDef<T>[];
  rowId?: string;
  noPagination?: boolean;
  selected?: GridRowSelectionModel;
  onSelected?: (value: GridRowSelectionModel) => void;
  toolbar?: () => JSX.Element;
};

export function useGrid<T extends GridValidRowModel>({ rows, columns, rowId, noPagination, selected, onSelected, toolbar }: UseScheduleProps<T>): () => JSX.Element {
  const grid = useMemo(() => {
    return <DataGrid
      autoHeight
      sx={{ bgcolor: 'secondary.dark', boxShadow: '4' }}
      rows={rows}
      columns={columns}
      checkboxSelection={!!selected}
      pageSizeOptions={noPagination ? [] : [5, 10, 25]}
      rowSelectionModel={selected}
      getRowId={row => (rowId ? row[rowId] : row.id) as string}
      onRowSelectionModelChange={onSelected}
      slots={{ toolbar: () => toolbar ? <Grid container p={2} alignItems="center">{toolbar()}</Grid> : <></> }}
    />
  }, [rows, rowId, columns, noPagination, selected]);

  return () => grid;
}