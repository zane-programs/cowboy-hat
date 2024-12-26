import { type ColorResult } from "@uiw/react-color";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./App.module.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export default function App() {
  const [hexColor, setHexColor] = useState<string>("#ffffff");
  // const [connectedUsers, setConnectedUsers] = useState<number>(-1);
  const [webSocketIsOpen, setWebSocketIsOpen] = useState<boolean>(false);
  const webSocketRef = useRef<WebSocket>();

  useEffect(() => {
    let reconnectInterval: number | null = null;

    const connectWebSocket = () => {
      const socket = new WebSocket(SOCKET_URL);
      webSocketRef.current = socket;

      const onOpen = () => {
        setWebSocketIsOpen(true);
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      };

      const onClose = () => {
        setWebSocketIsOpen(false);
        if (!reconnectInterval) {
          reconnectInterval = window.setInterval(() => {
            console.log("Attempting to reconnect...");
            connectWebSocket();
          }, 2000);
        }
      };

      const onMessage = (ev: MessageEvent<string>) => {
        if (ev.data.indexOf("users:") === 0) {
          // setConnectedUsers(parseInt(ev.data.split(":")[1]));
          console.log(ev.data);
        } else {
          setHexColor(
            "#" +
              ev.data
                .split(",")
                .map((item) => parseInt(item).toString(16).padStart(2, "0"))
                .join("")
          );
        }
      };

      socket.addEventListener("open", onOpen);
      socket.addEventListener("close", onClose);
      socket.addEventListener("message", onMessage);

      return () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("close", onClose);
        socket.removeEventListener("message", onMessage);
        socket.close();
      };
    };

    const cleanup = connectWebSocket();

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      cleanup();
    };
  }, []);

  // const handleColorChange = useCallback(({ hex, rgb }: ColorResult) => {
  //   setHexColor(hex);
  //   webSocketRef.current?.send(`${rgb.r},${rgb.g},${rgb.b}`);
  // }, []);

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} style={{ backgroundColor: hexColor }} />
      <main className={styles.wheelContainer}>
        {webSocketIsOpen ? (
          <>
            <h1
              style={{
                filter: `drop-shadow(0 -0.14em 0.2em ${hexColor}) drop-shadow(0 0.14em 0.2em ${hexColor}) drop-shadow(0 0 0.05em #000)`,
              }}
            >
              Choose My Color
            </h1>
            <p>{hexColor}</p>
            {/* <Wheel color={hexColor} onChange={handleColorChange} />
            <p>
              This page is being viewed by {connectedUsers}{" "}
              {connectedUsers === 1 ? "person" : "people"}
            </p> */}
          </>
        ) : (
          <>
            <div className={styles.spinner} aria-busy></div>
            <p>Connecting&hellip;</p>
          </>
        )}
      </main>
    </div>
  );
}
