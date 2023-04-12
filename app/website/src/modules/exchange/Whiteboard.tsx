import React, { useRef, useState, useEffect } from 'react';

type Whiteboard = {
  id: string;
  lines: Array<{
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
  }>;
};

function useWebSocketWhiteboard(id: string, socket: WebSocket) {
  const [whiteboard, setWhiteboard] = useState<Whiteboard>({ id: '', lines: [] });

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
  const { whiteboard, addLine } = props as Required<IProps>;
const socket = useRef<WebSocket>(new WebSocket('ws://localhost:8080'));

  const sendLine = (message: string) => {
  if (socket.current.readyState === 1) {
    socket.current.send(message);
  }
};
const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onReceiveMessage = (event: MessageEvent): void => {
      const messageData = JSON.parse(event.data);
      const newWhiteboard = Object.assign({}, whiteboard);
      switch (messageData.type) {
        case 'id':
          newWhiteboard.id = messageData.data;
          break;
        case 'line':
          newWhiteboard.lines.push(messageData.data);
          const line = messageData.data;
          drawLine(line.startPoint, line.endPoint);
          break;
        default:
          break;
      }
      setWhiteboard(newWhiteboard);
    };

    socket.current.onopen = () => {
      console.log('WebSocket Client Connected');
    };

    socket.current.onmessage = onReceiveMessage;

    function drawLine(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): void {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }

    function handleMouseDown(event: MouseEvent): void {
      const startPoint = { x: event.clientX, y: event.clientY };

      function handleMouseMove(event: MouseEvent): void {
        if (!ctx) return;
        const endPoint = { x: event.clientX, y: event.clientY };
        drawLine(startPoint, endPoint);
        const message = JSON.stringify({ type: 'line', data: { startPoint, endPoint } });
        sendLine(message);
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

    socket.current.onopen = function () {
      const message = JSON.stringify({ type: 'id' });
      sendLine(message);
    };
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      socket.current.close();
    };
  }, [whiteboard, canvasRef]);

  return <canvas ref={canvasRef} width={800} height={600} />;
}