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
    socket.send(
      JSON.stringify({
        type: "whiteboardUpdate",
        data: JSON.stringify(updatedWhiteboard),
      })
    );
  }

  return { whiteboard, addLine, setInterval };
}

interface IProps {
  whiteboard?: Whiteboard | null;
}

export default function Whiteboard(props: IProps): JSX.Element {
  const Whiteboard: React.FC<IProps> = ({ whiteboard }) => {
    return <>Whiteboard Module could go here...</>;
  };

  return <canvas ref={canvasRef} width={800} height={600} />;
}
