import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

import { IFile, IFilesActionTypes, FileStoreStrategies } from 'awayto';
import { useApi, useRedux, useFileStore } from 'awayto-hooks';

const { POST_FILES, DELETE_FILES } = IFilesActionTypes;

declare global {
  interface IProps {
    parentUuid?: string;
  }
}

export function FileManager ({ parentUuid }: IProps): JSX.Element {
  const api = useApi();
  const fileSelectRef = useRef<HTMLInputElement>(null);
  const files = useRedux(state => state.files);
  const util = useRedux(state => state.util);
  const fileStore = useFileStore();
  const [toggle, setToggle] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<IFile[]>([]);
  const updateSelection = useCallback((state: { selectedRows: IFile[] }) => setSelected(state.selectedRows), [setSelected]);

  function addFiles() {
    if (fileSelectRef.current) {
      fileSelectRef.current.click();
    }
  }

  function deleteFiles(){
    if (selected.length) {
      void api(DELETE_FILES, true, selected);
      setToggle(!toggle);
    }
  }

  useEffect(() => {
    if (newFiles.length) {
      async function go() {
        const postFiles: IFile[] = [];
        for (let i = 0, v = newFiles.length; i < v; i++) {
          const file = newFiles[i];
          const location = await fileStore.post(file);
          postFiles.push({ location, name: file.name, fileTypeName: FileStoreStrategies.FILE_SYSTEM })
        }
        void api(POST_FILES, true, postFiles);
      }
      void go();
    }
  }, [newFiles])

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name },
  ] as TableColumn<IFile>[], undefined)

  const actions = useMemo(() => {
    const { length } = selected;
    return [
      <Button key={'delete_selected_files'} onClick={deleteFiles}>Delete</Button>,
    ];
  }, [selected])

  return <>
    <input type="file" multiple id="new-file" onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))} ref={fileSelectRef} style={{display: 'none'}}/>

    <DataTable
      style={{ maxHeight: '150px', overflow: 'auto' }}
      title="Files"
      actions={<Button onClick={addFiles}>Add</Button>}
      contextActions={actions}
      data={files ? Object.values(files) : []}
      theme={util.theme}
      columns={columns}
      selectableRows
      selectableRowsHighlight={true}
      // selectableRowsComponent={<Checkbox />}
      onSelectedRowsChange={updateSelection}
      clearSelectedRows={toggle}
    />
  </>
}

export default FileManager;