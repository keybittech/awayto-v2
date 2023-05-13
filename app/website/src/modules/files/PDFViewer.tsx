import React, { useEffect, useState } from 'react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

import { IFile } from 'awayto/core';
import { useFileContents } from 'awayto/hooks';

declare global {
  interface IProps {
    canvasRef?: React.RefObject<HTMLCanvasElement>;
    file?: IFile;
    scale?: number;
    onRenderSuccess?: () => void;
  }
}

export function PDFViewer({ canvasRef, file, scale = 1, onRenderSuccess }: IProps): React.JSX.Element {

  const { fileDetails, getFileContents } = useFileContents();

  useEffect(() => {
    if (file && !fileDetails) {
      getFileContents(file).catch(console.error);
    }
  }, [fileDetails]);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  return !fileDetails || !canvasRef ? <></> : 
  <Document
    file={fileDetails.url}
    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
  >
    <Page
      scale={scale}
      canvasRef={canvasRef}
      renderAnnotationLayer={false}
      pageNumber={pageNumber}
      onRenderSuccess={onRenderSuccess}
    />
  </Document>;
}

export default PDFViewer;