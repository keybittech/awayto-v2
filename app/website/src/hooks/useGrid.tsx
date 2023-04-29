import React, { useMemo } from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel, GridValidRowModel } from '@mui/x-data-grid';

import Grid from '@mui/material/Grid';

type UseScheduleProps<T extends GridValidRowModel> = {
  rows: T[];
  columns: GridColDef<T>[];
  rowId?: string;
  noPagination?: boolean;
  selected?: GridRowSelectionModel;
  disableRowSelectionOnClick?: boolean;
  onSelected?: (value: GridRowSelectionModel) => void;
  toolbar?: () => JSX.Element;
};

export function useGrid<T extends GridValidRowModel>({ rows, columns, rowId, noPagination, selected, onSelected, toolbar, disableRowSelectionOnClick = true }: UseScheduleProps<T>): () => JSX.Element {
  const grid = useMemo(() => {
    return <DataGrid
      autoHeight
      sx={{ bgcolor: 'secondary.dark' }}
      rows={rows}
      columns={columns}
      rowSelectionModel={selected}
      checkboxSelection={!!selected}
      onRowSelectionModelChange={onSelected}
      pageSizeOptions={noPagination ? [] : [5, 10, 25]}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      getRowId={row => (rowId ? row[rowId] : row.id) as string}
      slots={{ toolbar: () => toolbar ? <Grid container p={2} alignItems="center">{toolbar()}</Grid> : <></> }}
    />
  }, [rows, rowId, columns, noPagination]);

  return () => grid;
}