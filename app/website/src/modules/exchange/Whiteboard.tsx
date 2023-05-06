import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

function useWebSocketWhiteboard(id: string, socket: MutableRefObject<WebSocket | undefined>) {
  const [whiteboard, setWhiteboard] = useState({ id, lines: [] } as Whiteboard);

  useEffect(() => {
    if (socket?.current) {
      function handleMessage(event: { data: string }) {
        const message = JSON.parse(event.data) as { type: string, data: string };
  
        if (message.type === "whiteboardUpdate") {
          setWhiteboard(JSON.parse(message.data) as Whiteboard);
        }
      }
  
      socket.current.addEventListener("message", handleMessage);
  
      return () => {
        socket?.current?.removeEventListener("message", handleMessage);
      };
    }
  }, [socket]);

  const addLine = useCallback((
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ) => {
    if (!socket?.current) return;
    const updatedWhiteboard = {
      id: whiteboard.id,
      lines: [...whiteboard.lines, { startPoint, endPoint }],
    };

    setWhiteboard(updatedWhiteboard);
    socket.current.send(
      JSON.stringify({
        type: "whiteboardUpdate",
        data: JSON.stringify(updatedWhiteboard),
      })
    );
  }, [socket]);

  return { whiteboard, addLine };
}

interface Whiteboard {
  id: string;
  lines: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[];
}

interface IProps {
  whiteboard?: Whiteboard | null;
}

function getRelativeCoordinates(event: React.MouseEvent<HTMLCanvasElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

export default function Whiteboard(props: IProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useRef<WebSocket>();

  // useEffect(() => {
  //   socket.current = new WebSocket("wss://wcapp.site.com/sock");
  // }, []);
  
  const { whiteboard, addLine } = useWebSocketWhiteboard("whiteboard-id", socket);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
    const startPoint = getRelativeCoordinates(event);

    const onMouseMove = (e: MouseEvent) => {
      const endPoint = { x: e.clientX, y: e.clientY };
      const relativeEndPoint = {
        x: endPoint.x - canvasRef.current!.getBoundingClientRect().left,
        y: endPoint.y - canvasRef.current!.getBoundingClientRect().top,
      };
      addLine(startPoint, relativeEndPoint);
      startPoint.x = relativeEndPoint.x;
      startPoint.y = relativeEndPoint.y;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };


  return (
    <canvas
      ref={canvasRef}
      width="100%"
      height="70vh"
      onMouseDown={handleMouseDown}
      style={{ border: "1px solid black" }}
    />
  );
}
