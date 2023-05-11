import { useCallback,  useState } from 'react';
import keycloak from '../keycloak';
import { BufferResponse } from 'awayto/core';

type UseFileContents = () => {
  fileDetails: BufferResponse | undefined,
  getFileContents: (id: string, download?: boolean) => Promise<BufferResponse>
}

export const useFileContents: UseFileContents = () => {
  const [fileDetails, setFileDetails] = useState<BufferResponse | undefined>();

  const getFileContents = useCallback<ReturnType<UseFileContents>['getFileContents']>(async (id, download) => {
    
    const response = await fetch(`/api/files/content/${id}`, {
      headers: {
        'Authorization': `Bearer ${keycloak.token as string}`
      }
    });
      
    const contentDisposition = response.headers.get("Content-Disposition");
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(contentDisposition || '');
    const name = matches && matches[1] ? matches[1].replaceAll('"', '') : "unknown";
    const buffer = await response.arrayBuffer();
    const details = { name, buffer };

    setFileDetails(details);

    if (download) {
      const url = window.URL.createObjectURL(new Blob([buffer]));
      const link = document.createElement('a');
      link.id = 'site-file-downloader';
      link.href = url;
      link.setAttribute('download', 'downloaded-' + name); // or any other extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return details;
  }, []);

  return { fileDetails, getFileContents };
}