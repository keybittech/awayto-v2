import React, { useState, useCallback } from 'react';

import { useComponents } from './useComponents';
import { IFile } from 'awayto/core';

export function useFiles(): {
  files: IFile[];
  comp: (props: IProps) => JSX.Element;
} {
  const { FileManager } = useComponents();
  const [files, setFiles] = useState<IFile[]>([]);

  const comp = useCallback((props: IProps) => {
    return <FileManager files={files} setFiles={setFiles} />;
  }, [files]);

  return { files, comp };
}

export default useFiles;
