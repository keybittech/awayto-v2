import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const parentRef = useRef<HTMLDivElement>(null);

  const [whiteboard, setWhiteboard] = useState({ lines: [] } as Whiteboard);

  const { connected, sendMessage: sendExchangeMessage } = useWebSocketSubscribe<Whiteboard>('exchange-id', ({ sender, topic, type, payload }) => {
    console.log('whiteboard event', { sender, topic, type, payload })
    if (payload.lines?.length) {
      const [{ startPoint, endPoint }] = payload.lines;
      addLine(startPoint, endPoint);
    }
  });

  const addLine = useCallback((
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ) => {
    if (connected) {
      const updatedWhiteboard = {
        lines: [...whiteboard.lines, { startPoint, endPoint }],
      };
  
      setWhiteboard(updatedWhiteboard);
    }
  }, [connected, whiteboard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines
    whiteboard.lines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(line.startPoint.x, line.startPoint.y);
      ctx.lineTo(line.endPoint.x, line.endPoint.y);
      ctx.stroke();
    });
  }, [whiteboard]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const startPoint = getRelativeCoordinates(event, canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onMouseMove = (e: MouseEvent) => {
      const endPoint = getRelativeCoordinates(e, canvas);
      sendExchangeMessage('whiteboardUpdate', { lines: [{ startPoint, endPoint }] });
      
      // Draw line segment
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

      // Update startPoint
      startPoint.x = endPoint.x;
      startPoint.y = endPoint.y;
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