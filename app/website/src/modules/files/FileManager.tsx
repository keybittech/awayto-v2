import React, { useRef, useMemo, useState, useCallback } from 'react';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';

import { sh, useFileContents, useGrid } from 'awayto/hooks';
import { IFile, nid } from 'awayto/core';

declare global {
  interface IProps {
    files?: IFile[];
    setFiles?: (files: IFile[]) => void
  }
}

function FileManager({ files, setFiles }: Required<IProps>): JSX.Element {

  const fileSelectRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<string[]>([]);

  const [postFileContents] = sh.usePostFileContentsMutation();
  const [putFileContents] = sh.usePutFileContentsMutation();
  
  const { getFileContents } = useFileContents();
  
  const actions = useMemo(() => {
    return [
      <Button key={'delete_selected_files'} onClick={deleteFiles}>Delete</Button>,
    ];
  }, [selected]);

  const fileGridProps = useGrid({
    rows: files || [],
    columns: [
      {
        flex: 1,
        headerName: 'Name',
        field: 'name',
        renderCell: ({ row: file }) => <Button onClick={() => {
          getFileContents(file, true).catch(console.error);
        }}>{file.name}</Button>
      },
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={addFiles}>Add File</Button>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  });

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadPromises = Array.from(event.target.files).map(async (file) => {
        const buffer = await file.arrayBuffer();
        const name = file.name;
        const mimeType = file.type;
        const { id } = await postFileContents(buffer).unwrap();
        const { success } = await putFileContents({ id, name, mimeType }).unwrap();
        
        if (success) {
          // Create object that will go into the table
          return {
            id: nid(),
            uuid: id,
            name: file.name,
            mimeType
          };
        }
        return null;
      });
  
      try {
        const newFiles: IFile[] = (await Promise.all(uploadPromises)).filter(Boolean) as IFile[];
        setFiles([ ...files, ...newFiles ]);
      } catch (error) {
        console.error(error);
      }
    }
  }, [setFiles]);
  
  function addFiles() {
    if (fileSelectRef.current) {
      fileSelectRef.current.value = '';
      fileSelectRef.current.click();
    }
  }

  function deleteFiles() {
    if (selected.length) {
      setFiles([ ...files.filter(f => !selected.includes(f.id)) ]);
    }
  }

  return <>
    <input type="file" multiple id="new-file" onChange={e => { handleFileChange(e).catch(console.error) } } ref={fileSelectRef} style={{ display: 'none' }} />

    <DataGrid {...fileGridProps} />
  </>
}

export default FileManager;