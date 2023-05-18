
/**
 * need to capture the idea where runons, etc. can be highlighted throughout a page after post processing
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import GestureIcon from '@mui/icons-material/Gesture';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import HighlightIcon from '@mui/icons-material/Highlight';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import { useWebSocketSubscribe, useStyles, useFileContents } from 'awayto/hooks';

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


interface Whiteboard {
  lines: {
    startPoint: {
      x: number;
      y: number;
    };
    endPoint: {
      x: number;
      y: number;
    };
  }[];
  settings: Partial<{
    page: number;
    scale: number;
    highlight: boolean;
    position: [number, number];
  }>
}

export default function Whiteboard({ topicId }: IProps): React.JSX.Element {
  if (!topicId) return <></>;

  const fileId = 'b789e0dc-7d05-479d-9eef-0505a54a7659';
  const fileType = 'application/pdf';

  const whiteboardRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileDisplayRef = useRef<HTMLCanvasElement>(null);
  const fileScroller = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const whiteboard = useRef<Whiteboard>({ lines: [], settings: { highlight: false, position: [0, 0] } });

  const classes = useStyles();

  const [canvasPointerEvents, setCanvasPointerEvents] = useState('none');
  const [zoom, setZoom] = useState(1);
  const { fileDetails, getFileContents } = useFileContents();

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [boards, setBoards] = useState<Record<string, Partial<Whiteboard>>>({});

  const {
    sendMessage: sendWhiteboardMessage
  } = useWebSocketSubscribe<Whiteboard>(topicId, ({ sender, type, payload }) => {
    setBoards(b => {
      const board = {  ...b[sender], ...payload };
      if ('set-position' === type) {
        const [left, top] = board.settings?.position || [];
        fileScroller.current?.scrollTo({ left, top });
      } else if ('set-scale' === type) {
        whiteboard.current.settings.scale = board.settings?.scale || 1;
        setZoom(whiteboard.current.settings.scale);
      } else if ('set-page' === type) {
        whiteboard.current.settings.page = board.settings?.page || 1;
        setPageNumber(whiteboard.current.settings.page);
      } else if ('draw-lines' === type) {
        handleLines(payload.lines, board.settings);
      } else if ('change-setting' === type) {
      }
      return { ...b, [sender]: board };
    });
  });

  const handleLines = (lines?: Whiteboard['lines'], settings?: Whiteboard['settings']) => {
    const draw = () => {
      const canvas = whiteboardRef.current;
      if (!canvas) return;
      const ctx = contextRef.current;
      if (!ctx) return;
  
      lines?.forEach((line, i) => {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(line.startPoint.x, line.startPoint.y);
        }
  
        ctx.lineTo(line.endPoint.x, line.endPoint.y);
      });
  
      if (settings?.highlight) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 10;
        ctx.globalAlpha = .33;
      } else {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = ctx.globalAlpha = 1;
      }
  
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = whiteboardRef.current;
    if (!canvas) return;

    const startPoint = getRelativeCoordinates(event, canvas);
    let lastPoint = startPoint;

    const onMouseMove = (e: MouseEvent) => {
      const endPoint = getRelativeCoordinates(e, canvas);
      const newLine = {
        startPoint: { ...lastPoint },
        endPoint: { ...endPoint }
      };
      whiteboard.current = {
        ...whiteboard.current,
        lines: [
          ...whiteboard.current.lines,
          newLine
        ],
      }

      handleLines([newLine], whiteboard.current.settings);

      // Update lastPoint
      lastPoint = endPoint;
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const setDrawStyle = (hl: boolean) => {
    whiteboard.current.settings.highlight = hl;
    sendWhiteboardMessage('change-setting', { settings: { highlight: hl } });
    setCanvasPointerEvents('auto');
  };

  const setScale = (inc: boolean) => {
    const scale = whiteboard.current.settings.scale || 1;
    sendWhiteboardMessage('set-scale', { settings: { scale: inc ? scale + .15 : scale - .15 } });
  };

  const setPage = (next: boolean) => {
    let page = whiteboard.current.settings.page || 1;
    next ? page++ : page--;
    sendWhiteboardMessage('set-page', { settings: { page: next ? Math.min(page, numPages) : (page || 1) } });
  };

  const sendBatchedData = () => {
    if (whiteboard.current.lines.length > 0) {
      sendWhiteboardMessage('draw-lines', { lines: whiteboard.current.lines });
      whiteboard.current = { ...whiteboard.current, lines: [] };
    }
  };

  useEffect(() => {
    const interval = setInterval(sendBatchedData, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!fileDetails) {
      getFileContents({ mimeType: fileType, uuid: fileId }).catch(console.error);
    }
  }, [fileDetails]);

  useEffect(() => {
    const scrollDiv = fileScroller.current;
    if (scrollDiv) {

      const onFileScroll = (e: Event) => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          whiteboard.current.settings.position = [scrollDiv.scrollLeft, scrollDiv.scrollTop];
          sendWhiteboardMessage('set-position', whiteboard.current);
        }, 150);
      };

      scrollDiv.addEventListener('scroll', onFileScroll);

      return () => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollDiv.removeEventListener('scroll', onFileScroll);
      };
    }
  }, [fileScroller.current]);

  useEffect(() => {
    if (null !== whiteboardRef.current && !contextRef.current) {
      contextRef.current = whiteboardRef.current.getContext('2d');
    }
  }, [whiteboardRef, contextRef]);

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
      onClick={() => setScale(true)}
    >
      <AddIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 75 }}
      onClick={() => setScale(false)}
    >
      <RemoveIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 125 }}
      onClick={() => setPage(false)}
    >
      <NavigateBeforeIcon />
    </IconButton>
    <IconButton
      color="primary"
      className={classes.whiteboardActionButton}
      sx={{ top: 175 }}
      onClick={() => setPage(true)}
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