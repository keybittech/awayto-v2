import React, { useRef, useMemo, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { sh, useGrid } from 'awayto/hooks';

declare global {
  interface IProps {
    parentUuid?: string;
  }
}

export function FileManager(): JSX.Element {

  const { data: files } = sh.useGetFilesQuery();
  
  const fileSelectRef = useRef<HTMLInputElement>(null);

  const [toggle, setToggle] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const actions = useMemo(() => {
    return [
      <Button key={'delete_selected_files'} onClick={deleteFiles}>Delete</Button>,
    ];
  }, [selected]);

  const FileGrid = useGrid({
    rows: files || [],
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Button onClick={addFiles}>Add</Button>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  function addFiles() {
    if (fileSelectRef.current) {
      fileSelectRef.current.click();
    }
  }

  function deleteFiles() {
    if (selected.length) {
      // void api(DELETE_FILE, true, selected);
      setToggle(!toggle);
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
    {/* <input type="file" multiple id="new-file" onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))} ref={fileSelectRef} style={{ display: 'none' }} /> */}

    <Card>
      <CardContent>
        <FileGrid />
      </CardContent>
    </Card>
  </>
}

export default FileManager;