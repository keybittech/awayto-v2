import React, { useMemo } from 'react';

import { sh, useComponents, useContexts, useFileContents } from 'awayto/hooks';

export function FileProvider({ children }: IProps): React.JSX.Element {

  const { FileContext } = useContexts();

  const { FileManager } = useComponents();

  const getFiles = sh.useGetFilesQuery();
  
  const { fileDetails, getFileContents } = useFileContents();

  const fileContext = {
    getFiles,
    fileDetails,
    getFileContents,
    fileManager: FileManager
  } as FileContextType;

  return useMemo(() => !FileContext ? <></> :
    <FileContext.Provider value={fileContext}>
      {children}
    </FileContext.Provider>,
    [FileContext, fileContext]
  );
}