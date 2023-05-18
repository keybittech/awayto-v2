import { useCallback,  useMemo,  useState } from 'react';
import keycloak from '../keycloak';
import { IFile, UseFileContents } from 'awayto/core';

export const useFileContents: UseFileContents = () => {
  const [fileDetails, setFileDetails] = useState<IFile | undefined>();

  const getFileContents = useCallback<ReturnType<UseFileContents>['getFileContents']>(async (fileRef, download) => {
    if (!fileRef.uuid || !fileRef.mimeType) return undefined;

    const response = await fetch(`/api/files/content/${fileRef.uuid}`, {
      headers: {
        'Authorization': `Bearer ${keycloak.token as string}`
      }
    });

    const buffer = await response.arrayBuffer();
    const contentDisposition = response.headers.get("Content-Disposition");
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(contentDisposition || '');
    fileRef.name = matches && matches[1] ? matches[1].replaceAll('"', '') : "unknown";
    fileRef.url = window.URL.createObjectURL(new Blob([buffer], { type: fileRef.mimeType }));

    setFileDetails(fileRef as IFile);

    if (download) {
      const link = document.createElement('a');
      link.id = 'site-file-downloader';
      link.href = fileRef.url;
      link.setAttribute('download', 'downloaded-' + fileRef.name); // or any other extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return fileRef as IFile;
  }, []);

  return useMemo(() => ({ fileDetails, getFileContents }), [fileDetails]);
}