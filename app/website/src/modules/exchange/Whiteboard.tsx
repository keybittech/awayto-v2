import React from "react"; //importing React library

function useWebSocketWhiteboard(id: string, socket: WebSocket) {
  const ws = new WebSocket("wss://wcapp.site.com/sock"); //create a new websocket connection //create a new websocket connection
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
} //interface for props passed to the Whiteboard component

export default function Whiteboard(props: IProps): JSX.Element {
  const Whiteboard: React.FC<IProps> = ({ whiteboard }) => {
    return <>Whiteboard Module could go here...</>;
  }; //creating a functional component for the Whiteboard module

  const canvasRef = useRef<HTMLCanvasElement>(null); //creating a ref to the HTML canvas element
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null); //creating a state variable for the whiteboard object

  useEffect(() => {
    if (canvasRef.current) {
      const newWhiteboard = new Whiteboard(canvasRef.current); //create a new whiteboard object with the canvasRef
      setWhiteboard(newWhiteboard); //update state with the newly created whiteboard object
    }
  }, []); //run this effect only once on initial render

  const addLine = (line: Line) => {
    if (whiteboard) {
      whiteboard.addLine(line); //add a line to the whiteboard if it exists
    }
  }; //adding a function to add a line to the whiteboard

  const testDrawing = () => {
    const newLine = {
      startX: Math.random() * 100, // x-coordinate
      startY: Math.random() * 100, // y-coordinate
      endX: Math.random() * 100, // x-coordinate
      endY: Math.random() * 100, // y-coordinate
    };
    addLine(newLine); //add a new line to the whiteboard every second
  }; //test function for simulating drawing

  setInterval(() => {
    testDrawing(); //run the testDrawing function every second
  }, 1000); //set an interval to run the testDrawing function every second
  const ws = new WebSocket("wss://wcapp.site.com/sock");

  ws.onmessage = function (event) {
    console.log(event); //log the event message to the console when a message is received on the websocket connection
  };
  socket.on("whiteboardUpdate", function (msg) {
    const updatedWhiteboard = msg.data; // store incoming whiteboard data into a variable
    //update the local whiteboard state here
    /* whiteboard.updateWhiteboard(updatedWhiteboard) */
    //adding a test drawing to simulate incoming messages
    setInterval(() => {
      testDrawing();
    }, 1000);
  }); //adding an event listener for the 'whiteboardUpdate' socket message
}
