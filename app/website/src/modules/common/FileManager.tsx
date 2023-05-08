import React, { useRef, useMemo, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { DataGrid } from '@mui/x-data-grid';

import { sh, useGrid } from 'awayto/hooks';
import { IFile } from 'awayto/core';

declare global {
  interface IProps {
    files?: IFile[];
    setFiles?: (files: IFile[]) => void
  }
}

function FileManager({ files, setFiles }: Required<IProps>): JSX.Element {
  
  const [postFileContents] = sh.usePostFileContentsMutation();

  const fileSelectRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<string[]>([]);

  const actions = useMemo(() => {
    return [
      <Button key={'delete_selected_files'} onClick={deleteFiles}>Delete</Button>,
    ];
  }, [selected]);

  const fileGridProps = useGrid({
    rows: files || [],
    columns: [
      { flex: 1, headerName: 'Id', field: 'id' },
      { flex: 1, headerName: 'Name', field: 'name' },
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={addFiles}>Add File</Button>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadPromises = Array.from(event.target.files).map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const response = await postFileContents(arrayBuffer).unwrap();
  
        if (response) {
          return {
            id: response.id,
            fileTypeId: '', // Update this based on your implementation
            fileTypeName: '', // Update this based on your implementation
            name: file.name,
            location: '', // Update this based on your implementation
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

  // useEffect(() => {
  //   if (newFiles.length) {
  //     async function go() {
  //       const postFiles: IFile[] = [];
  //       for (let i = 0, v = newFiles.length; i < v; i++) {
  //         const file = newFiles[i];
  //         const location = await fileStore.post(file);
  //         postFiles.push({ location, name: file.name, fileTypeName: FileStoreStrategies.FILE_SYSTEM })
  //       }
  //       void api(POST_FILE, true, postFiles);
  //     }
  //     void go();
  //   }
  // }, [newFiles])

  return <>
    <input type="file" multiple id="new-file" onChange={e => { handleFileChange(e).catch(console.error) } } ref={fileSelectRef} style={{ display: 'none' }} />

    <Card>
      <CardContent>
        <DataGrid {...fileGridProps} />
      </CardContent>
    </Card>
  </>
}

export default FileManager;