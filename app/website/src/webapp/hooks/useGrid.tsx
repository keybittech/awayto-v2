import React, { useMemo } from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel, GridValidRowModel } from '@mui/x-data-grid';


type UseScheduleProps<T extends GridValidRowModel> = {
  rows: T[];
  columns: GridColDef<T>[];
  rowId?: string;
  selected?: GridRowSelectionModel;
  onSelected?: (value: GridRowSelectionModel) => void;
  toolbar?: () => JSX.Element;
};

export function useGrid<T extends GridValidRowModel>({ rows, columns, rowId, selected, onSelected, toolbar }: UseScheduleProps<T>): () => JSX.Element {
  const grid = useMemo(() => {
    return <DataGrid
      autoHeight
      sx={{ bgcolor: 'secondary.dark', boxShadow: '4' }}
      rows={rows}
      columns={columns}
      checkboxSelection
      pageSizeOptions={[5, 10, 25]}
      rowSelectionModel={selected}
      getRowId={row => (rowId ? row[rowId] : row.id) as string}
      onRowSelectionModelChange={onSelected}
      slots={{ toolbar }}
    />
  }, [rows, columns, selected]);

  return () => grid;
}