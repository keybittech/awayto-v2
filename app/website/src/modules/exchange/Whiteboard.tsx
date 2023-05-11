import React, { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import GestureIcon from '@mui/icons-material/Gesture';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LayersClearIcon from '@mui/icons-material/LayersClear';

import { useFileContents, useWebSocketSubscribe, useStyles } from 'awayto/hooks';
import { IFile } from 'awayto/core';

interface Whiteboard {
  lines: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[];
}

function getRelativeCoordinates(event: MouseEvent | React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

declare global {
  interface IProps {
    fileRef?: Partial<IFile>;
  }
}

export default function Whiteboard({ fileRef }: IProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const parentRef = useRef<HTMLDivElement>(null);

  const classes = useStyles();

  const [canvasPointerEvents, setCanvasPointerEvents] = useState('none');

  const { fileDetails, getFileContents } = useFileContents();

  useEffect(() => {
    if (fileRef) {
      getFileContents(fileRef).catch(console.error);
    }
  }, [fileRef]);

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

  const batch = useRef<Whiteboard>({ lines: [] });

  const sendBatchedData = useCallback(() => {
    if (batch.current.lines.length > 0) {
      sendExchangeMessage('whiteboardUpdate', batch.current);
      batch.current = { lines: [] };
    }
  }, [sendExchangeMessage]);

  useEffect(() => {
    const interval = setInterval(sendBatchedData, 150);
    return () => clearInterval(interval);
  }, [sendBatchedData]);

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
      batch.current = {
        lines: [
          ...batch.current.lines,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;

    const setCanvasSize = () => {
      if (canvas && parent) {
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    setCanvasSize();

    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  useEffect(() => {
    if (null !== canvasRef.current && !contextRef.current) {
      contextRef.current = canvasRef.current.getContext('2d');
    }
  }, [canvasRef, contextRef]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!fileDetails) return;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", fileDetails.url, true);
    xhr.responseType = "blob";
    xhr.onload = function (this: { response: Blob, status: number }) {
      if (this.status === 200) {
        const file = window.URL.createObjectURL(this.response);
        if (iframeRef.current) {
          iframeRef.current.src = file;
        }
      }
    };
    xhr.send();
  }, [fileDetails]);

  return <Box ref={parentRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
    {fileDetails && <Box
      className={classes.absoluteFullChild}
      ref={iframeRef}
      component='iframe'
      src=''
    />}
    <Box
      className={classes.absoluteFullChild}
      sx={{
        pointerEvents: canvasPointerEvents
      }}
      ref={canvasRef}
      component='canvas'
      onMouseDown={handleMouseDown}
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
      color="warning" 
      className={classes.whiteboardActionButton}
      sx={{ left: { sm: 10, md: -50 }, bottom: 150 }} 
      onClick={() => setCanvasPointerEvents('auto')}
    >
      <GestureIcon />
    </IconButton>
  </Box>
}