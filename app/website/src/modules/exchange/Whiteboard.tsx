import { useWebSocketSubscribe } from "awayto/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";

function useWebSocketWhiteboard(id: string) {

  const [whiteboard, setWhiteboard] = useState({ lines: [] } as Whiteboard);


  const { connected, sendMessage: sendExchangeMessage } = useWebSocketSubscribe<Whiteboard>(id, ({ sender, topic, type, payload }) => {
    console.log('whiteboard event', { sender, topic, type, payload })
    if (payload.lines) {
      setWhiteboard(payload as Whiteboard);
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
      sendExchangeMessage('whiteboardUpdate', updatedWhiteboard);
    }
  }, [connected, whiteboard]);

  return { whiteboard, addLine };
}

interface Whiteboard {
  lines: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }[];
}

interface IProps {
  whiteboard?: Whiteboard | null;
}

function getRelativeCoordinates(event: MouseEvent | React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

export default function Whiteboard(props: IProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { whiteboard, addLine } = useWebSocketWhiteboard("exchange-id");

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const startPoint = getRelativeCoordinates(event, canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onMouseMove = (e: MouseEvent) => {
      const endPoint = getRelativeCoordinates(e, canvas);

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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        style={{
          border: "1px solid black",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}