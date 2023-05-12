import React, { useCallback, useEffect, useRef, useState } from 'react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

import { IFile } from 'awayto/core';
import { useFileContents, useStyles } from 'awayto/hooks';

declare global {
  interface IProps {
    fileRef?: IFile;
    width?: number;
    height?: number;
  }
}

export function FileViewer({ fileRef, width, height }: IProps): React.JSX.Element {
  const classes = useStyles();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { fileDetails, getFileContents } = useFileContents();

  useEffect(() => {
    if (fileRef && !fileDetails) {
      getFileContents(fileRef).catch(console.error);
    }
  }, [fileDetails]);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  const DocumentComp = useCallback(({ children }: IProps) => {
    return !fileDetails ? <></> : 
      <Document
        className={classes.pdfViewerComps}
        file={fileDetails.url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {children}
      </Document>
    },
    [fileDetails]
  );

  const PageComp = useCallback(() => {
    return !width ? <></> :
      <Page
        canvasRef={canvasRef}
        className={classes.pdfViewerComps}
        width={width}
        onRenderSuccess={() => {
          if (canvasRef.current) {
            const [textLayer] = document.getElementsByClassName('textLayer');
            const ele = textLayer as HTMLElement;
            ele.style.display = 'flex';
            ele.style.top = 'unset';
            ele.style.bottom = 'unset';
            ele.style.height = `${canvasRef.current.clientHeight.toString()}px`;
            ele.style.width = `${canvasRef.current.clientWidth.toString()}px`;
          }
        }}
        renderAnnotationLayer={false}
        pageNumber={pageNumber}
      />
    },
    [canvasRef, width]
  );

  return <DocumentComp>
    <PageComp />
  </DocumentComp>;
}

export default FileViewer;