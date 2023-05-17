import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';

import GestureIcon from '@mui/icons-material/Gesture';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import HighlightIcon from '@mui/icons-material/Highlight';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import { useWebSocketSubscribe, useStyles, useFileContents } from 'awayto/hooks';

interface Whiteboard {
  lines: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[];
  hightlight: boolean;
  doc: {
    position: [number, number]
  }
}

function getRelativeCoordinates(event: MouseEvent | React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

declare global {
  interface IProps {
    topicId?: string;
  }
}

/**
 * need to capture the idea where runons, etc. can be highlighted throughout a page after post processing
 */

export default function Whiteboard({ topicId }: IProps): React.JSX.Element {
  if (!topicId) return <></>;

  const fileId = 'b789e0dc-7d05-479d-9eef-0505a54a7659';
  const fileType = 'application/pdf';

  const whiteboardRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileScroller = useRef<HTMLDivElement>(null);
  const fileDisplayRef = useRef<HTMLCanvasElement>(null);
  const whiteboard = useRef<Whiteboard>({ lines: [], hightlight: false, doc: { position: [0, 0] } });

  const classes = useStyles();

  const [canvasPointerEvents, setCanvasPointerEvents] = useState('none');
  const [zoom, setZoom] = useState(1);
  const [highlight, setHightlight] = useState(false);
  const { fileDetails, getFileContents } = useFileContents();

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (!fileDetails) {
      getFileContents({ mimeType: fileType, uuid: fileId }).catch(console.error);
    }
  }, [getFileContents, fileDetails]);

  const { sendMessage: sendExchangeMessage } = useWebSocketSubscribe<Whiteboard>(topicId, ({ payload }) => {
    const newLines = payload.lines;
    if (newLines?.length) {
      const draw = () => {
        const canvas = whiteboardRef.current;
        if (!canvas) return;
        const ctx = contextRef.current;
        if (!ctx) return;

        newLines.forEach((line, i) => {
          if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(line.startPoint.x, line.startPoint.y);
          }

          ctx.lineTo(line.endPoint.x, line.endPoint.y);
        });
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }
  });

  const sendBatchedData = useCallback(() => {
    if (whiteboard.current.lines.length > 0) {
      sendExchangeMessage('whiteboardUpdate', whiteboard.current);
      whiteboard.current = { ...whiteboard.current, lines: [] };
    }
  }, [sendExchangeMessage]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = whiteboardRef.current;
    if (!canvas) return;

    const ctx = contextRef.current;
    if (!ctx) return;

    const startPoint = getRelativeCoordinates(event, canvas);
    let lastPoint = startPoint; // Use a local variable to store the last point

    const onMouseMove = (e: MouseEvent) => {
      const endPoint = getRelativeCoordinates(e, canvas);
      whiteboard.current = {
        ...whiteboard.current,
        lines: [
          ...whiteboard.current.lines,
          {
            startPoint: { ...lastPoint },
            endPoint: { ...endPoint }
          }
        ],
      }
      // Draw line segment
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      if (highlight) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 10;
        ctx.globalAlpha = .33;
      } else {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = ctx.globalAlpha = 1;
      }

      ctx.stroke();

      // Update lastPoint
      lastPoint = endPoint;
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const setDrawStyle = (hl: boolean) => {
    setHightlight(hl);
    setCanvasPointerEvents('auto');
  }

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fv = fileScroller.current;

    if (fv) {

      const onScrollEnd = () => {
        const target = fv;
        whiteboard.current.doc.position = [target.scrollLeft, target.scrollTop];
        sendExchangeMessage('updateWhiteboard', whiteboard.current);
      };

      const onFileScroll = (e: Event) => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          onScrollEnd();
        }, 500);
      };

      fv.addEventListener('scroll', onFileScroll);

      return () => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        fv.removeEventListener('scroll', onFileScroll);
      };
    }
  }, [fileScroller.current]);

  useEffect(() => {
    if (null !== whiteboardRef.current && !contextRef.current) {
      contextRef.current = whiteboardRef.current.getContext('2d');
    }
  }, [whiteboardRef, contextRef]);

  useEffect(() => {
    const interval = setInterval(sendBatchedData, 150);
    return () => clearInterval(interval);
  }, [sendBatchedData]);

  return <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>

    {/* General Canvas Background  */}
    <Box ref={fileScroller} sx={{
      backgroundColor: '#ccc',
      height: '100%',
      overflow: 'scroll',
      display: 'flex',
      position: 'relative',
      padding: '16px'
    }}>
      {/* Drawing Canvas */}
      <Box
        sx={{
          position: 'absolute',
          zIndex: 10,
          pointerEvents: canvasPointerEvents
        }}
        ref={whiteboardRef}
        component='canvas'
        onMouseDown={handleMouseDown}
      />

      {/* File Viewer */}
      {!fileDetails ? <></> : <Document 
        file={fileDetails.url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page
          scale={zoom}
          canvasRef={fileDisplayRef}
          renderAnnotationLayer={false}
          pageNumber={pageNumber}
          onRenderSuccess={() => {
            if (fileDisplayRef.current && whiteboardRef.current) {
              const { width, height } = fileDisplayRef.current.getBoundingClientRect();
              whiteboardRef.current.width = width;
              whiteboardRef.current.height = height;
            }
          }}
        />
      </Document>}
    </Box>

    {/* Top Button */}
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 25 }}
      onClick={() => setZoom(pz => pz + .15)}
    >
      <AddIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 75 }}
      onClick={() => setZoom(pz => pz - .15)}
    >
      <RemoveIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 125 }}
      onClick={() => setPageNumber(pn => pn-- && (pn || 1))}
    >
      <NavigateBeforeIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 175 }}
      onClick={() => setPageNumber(pn => pn++ && Math.min(pn, numPages))}
    >
      <NavigateNextIcon />
    </IconButton>

    {/* Bottom Buttons */}
    <IconButton
      color="warning"
      className={classes.whiteboardActionButton}
      sx={{ bottom: 200 }}
      onClick={() => setDrawStyle(true)}
    >
      <HighlightIcon />
    </IconButton>
    <IconButton
      color="success"
      className={classes.whiteboardActionButton}
      sx={{ bottom: 150 }}
      onClick={() => setDrawStyle(false)}
    >
      <GestureIcon />
    </IconButton>
    <IconButton
      color="error"
      className={classes.whiteboardActionButton}
      sx={{ bottom: 100 }}
      onClick={() => contextRef.current?.clearRect(0, 0, whiteboardRef.current?.width || 0, whiteboardRef.current?.height || 0)}
    >
      <LayersClearIcon />
    </IconButton>
    <IconButton
      color="info"
      className={classes.whiteboardActionButton}
      sx={{ bottom: 50 }}
      onClick={() => setCanvasPointerEvents('none')}
    >
      <TouchAppIcon />
    </IconButton>
  </Box>
}