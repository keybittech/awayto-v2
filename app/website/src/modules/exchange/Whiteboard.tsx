import React, { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import GestureIcon from '@mui/icons-material/Gesture';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import HighlightIcon from '@mui/icons-material/Highlight';

import { useWebSocketSubscribe, useStyles, useComponents } from 'awayto/hooks';

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

export default function Whiteboard(): JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const { FileViewer } = useComponents();

  const classes = useStyles();

  const [canvasPointerEvents, setCanvasPointerEvents] = useState('none');
  const [dimensions, setDimensions] = useState([0, 0]);
  const [highlight, setHightlight] = useState(false);

  const { sendMessage: sendExchangeMessage } = useWebSocketSubscribe<Whiteboard>('exchange-id', ({ payload }) => {
    const newLines = payload.lines;
    if (newLines?.length) {
      const draw = () => {
        const canvas = canvasRef.current;
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

  const whiteboard = useRef<Whiteboard>({ lines: [], hightlight: false, doc: { position: [0, 0] } });

  const sendBatchedData = useCallback(() => {
    if (whiteboard.current.lines.length > 0) {
      sendExchangeMessage('whiteboardUpdate', whiteboard.current);
      whiteboard.current = { ...whiteboard.current, lines: [] };
    }
  }, [sendExchangeMessage]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
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

  const fileId = 'b789e0dc-7d05-479d-9eef-0505a54a7659';
  const fileType = 'application/pdf';

  useEffect(() => {
    if (null !== canvasRef.current && !contextRef.current) {
      contextRef.current = canvasRef.current.getContext('2d');
    }
  }, [canvasRef, contextRef]);

  useEffect(() => {
    const interval = setInterval(sendBatchedData, 150);
    return () => clearInterval(interval);
  }, [sendBatchedData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;

    const setCanvasSize = () => {
      if (canvas && parent) {
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        setDimensions([parent.clientWidth, parent.clientHeight]);
      }
    };

    setCanvasSize();

    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return <Box ref={parentRef} sx={{ height: '100%', width: '100%', position: 'relative' }}>
    <Box
      className={classes.pdfViewerComps}
      sx={{
        zIndex: 10,
        pointerEvents: canvasPointerEvents
      }}
      ref={canvasRef}
      component='canvas'
      onMouseDown={handleMouseDown}
    />

    <FileViewer
      width={dimensions[0]}
      height={dimensions[1]}
      fileRef={{ mimeType: fileType,  uuid: fileId }}
    />

    <IconButton 
      color="info"
      className={classes.whiteboardActionButton}
      sx={{ left: { sm: 10, md: -50 }, bottom: 50 }} 
      onClick={() => setCanvasPointerEvents('none')}
    >
      <TouchAppIcon />
    </IconButton>
    <IconButton 
      color="error" 
      className={classes.whiteboardActionButton}
      sx={{ left: { sm: 10, md: -50 }, bottom: 100 }} 
      onClick={() => contextRef.current?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0)}
    >
      <LayersClearIcon />
    </IconButton>
    <IconButton 
      color="primary" 
      className={classes.whiteboardActionButton}
      sx={{ left: { sm: 10, md: -50 }, bottom: 150 }} 
      onClick={() => setDrawStyle(false)}
    >
      <GestureIcon />
    </IconButton>
    <IconButton 
      color="warning" 
      className={classes.whiteboardActionButton}
      sx={{ left: { sm: 10, md: -50 }, bottom: 200 }} 
      onClick={() => setDrawStyle(true)}
    >
      <HighlightIcon />
    </IconButton>
  </Box>
}