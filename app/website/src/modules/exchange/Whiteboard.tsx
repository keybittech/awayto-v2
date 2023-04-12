import React, { useRef, useState, useEffect } from 'react';

type Whiteboard = {
  id: string;
  lines: Array<{
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
  }>;
};

function useWebSocketWhiteboard(id: string, socket: WebSocket) {
  const id = uuidv4();
const ws = new WebSocket('wss://wcapp.site.com/sock');
const [whiteboard, setWhiteboard] = useWebSocketWhiteboard(ws.id, ws, { id, lines: [] });

  useEffect(() => {
    function handleMessage(message: { [prop: string]: string } & { type: string }): void {
      console.log({ GOTAMESSAGE: message });
      if (message.type === 'whiteboardUpdate') {
        setWhiteboard(JSON.parse(message.data));
      }
    }

    socket.addEventListener('message', event => handleMessage(event.data));

    return () => {
      socket.removeEventListener('message', event => handleMessage(event.data));
    };
  }, [socket]);

  function addLine(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): void {
    const updatedWhiteboard: Whiteboard = {
      id: whiteboard.id,
      lines: [...whiteboard.lines, { startPoint, endPoint }],
    };

    setWhiteboard(updatedWhiteboard);
    socket.send(
      JSON.stringify({
        type: 'whiteboardUpdate',
        data: JSON.stringify(updatedWhiteboard),
      })
    );
  }

  return { whiteboard, addLine };
}

declare global {
  interface IProps {
    whiteboard?: Whiteboard;
    addLine?: (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => void;
  }
}

export default function Whiteboard(props: IProps): JSX.Element {
  const { whiteboard, addLine } = props as Required<IProps> & {addLine: (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => void, whiteboard: Whiteboard};
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawLine(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): void {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
      addLine(startPoint, endPoint);
      setWhiteboard(prev => ({...prev, lines: [...prev.lines, {startPoint, endPoint}]}));
    }

    if (whiteboard && whiteboard.lines) {
      for (const line of whiteboard.lines) {
        if (line && line.startPoint && line.endPoint) {
          drawLine(line.startPoint, line.endPoint);
        }
      }
    }

    function handleMouseDown(event: MouseEvent): void {
      const startPoint = { x: event.clientX, y: event.clientY };

      function handleMouseMove(event: MouseEvent): void {
        if (!ctx) return;
        const endPoint = { x: event.clientX, y: event.clientY };
        drawLine(startPoint, endPoint);
        startPoint.x = endPoint.x;
        startPoint.y = endPoint.y;
      }

      document.addEventListener('mousemove', handleMouseMove);

      document.addEventListener(
        'mouseup',
        function handleMouseUp(event: MouseEvent): void {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
      );
    }

    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [whiteboard, addLine, setWhiteboard, canvasRef])

  return <canvas ref={canvasRef} width={800} height={600} />;
}