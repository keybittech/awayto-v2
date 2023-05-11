import React, { useCallback, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';

import { useWebSocketSubscribe } from 'awayto/hooks';

interface Whiteboard {
  lines: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[];
}

function getRelativeCoordinates(event: MouseEvent | React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

export default function Whiteboard(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const parentRef = useRef<HTMLDivElement>(null);

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
            startPoint: {...lastPoint},
            endPoint: {...endPoint}
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

  return <Box ref={parentRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        height: '100%',
        width:'100%'
      }}
    />
  </Box>
}