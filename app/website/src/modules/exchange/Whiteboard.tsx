import React from "react";

function useWebSocketWhiteboard(id: string, socket: WebSocket) {
  const ws = new WebSocket("wss://wcapp.site.com/sock");
  const [whiteboard, setWhiteboard] = useWebSocketWhiteboard(ws.id, ws, {
    id,
    lines: [],
  });

  useEffect(() => {
    function handleMessage(
      message: { [prop: string]: string } & { type: string }
    ): void {
      console.log({ GOTAMESSAGE: message });
      if (message.type === "whiteboardUpdate") {
        setWhiteboard(JSON.parse(message.data));
      }
    }

    socket.addEventListener("message", (event) => handleMessage(event.data));

    return () => {
      socket.removeEventListener("message", (event) =>
        handleMessage(event.data)
      );
    };
  }, [socket]);

  function addLine(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ): void {
    const updatedWhiteboard: Whiteboard = {
      id: whiteboard.id,
      lines: [...whiteboard.lines, { startPoint, endPoint }],
    };

    setWhiteboard(updatedWhiteboard);
    {
      const coords = { x: Math.random() * 800, y: Math.random() * 600 };
      const newLine = {
        start: { x: coords.x - 5, y: coords.y - 5 },
        end: { x: coords.x + 5, y: coords.y + 5 },
        color: "black",
        width: 2,
      };
      whiteboard.addLine(newLine);
      socket.send(
        JSON.stringify({
          type: "whiteboardUpdate",
          data: JSON.stringify(updatedWhiteboard),
        })
      );
      setTimeout(() => {
        // Remove the line
        whiteboard.lines.pop();
        // Remove the line from the canvas
        whiteboard.redraw();
      }, 5000);
    }
    socket.send(
      JSON.stringify({
        type: "whiteboardUpdate",
        data: JSON.stringify(updatedWhiteboard),
      })
    );
  }

  return { whiteboard, addLine };
}

interface IProps {
  whiteboard?: Whiteboard | null;
}

export default function Whiteboard(props: IProps): JSX.Element {
  const Whiteboard: React.FC<IProps> = ({ whiteboard }) => {
    return <>Whiteboard Module could go here...</>;
  };

  import socket from "socket.IO-client";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const newWhiteboard = new Whiteboard(canvasRef.current);
      setWhiteboard(newWhiteboard);
    }
  }, []);

  const addLine = (line: Line) => {
    if (whiteboard) {
      whiteboard.addLine(line);
    }
  };

  const interval = setInterval(() => {
    const newLine = {
      startX: Math.random() * 100, // x-coordinate
      startY: Math.random() * 100, // y-coordinate
      endX: Math.random() * 100, // x-coordinate
      endY: Math.random() * 100, // y-coordinate
    };
    addLine(newLine);
  }, 1000);
  socket.on("whiteboardUpdate", function (msg) {
    const updatedWhiteboard = msg.data;
    //update the local whiteboard state here
    /* whiteboard.updateWhiteboard(updatedWhiteboard) */

    // Code added here to simulate incoming socket messages
    const interval = setInterval(() => {
      const newLine = {
        startX: Math.random() * 100, // x-coordinate
        startY: Math.random() * 100, // y-coordinate
        endX: Math.random() * 100, // x-coordinate
        endY: Math.random() * 100, // y-coordinate
      };
      addLine(newLine);
    }, 1000);
  });
}
