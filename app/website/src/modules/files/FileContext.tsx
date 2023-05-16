import { createContext } from 'react';
import { IFile, UseFileContents } from 'awayto/core';
import { IDefaultedComponent, SiteEndpointDefinitions } from 'awayto/hooks';
import { UseQueryHookResult } from '@reduxjs/toolkit/dist/query/react/buildHooks';


declare global {
  type FileContextType = {
    getFiles: UseQueryHookResult<SiteEndpointDefinitions['getFiles']>;
    fileDetails: IFile;
    fileManager: IDefaultedComponent;
    getFileContents: ReturnType<UseFileContents>['getFileContents'];
  }
}

export const FileContext = createContext<FileContextType | null>(null);

export default FileContext;