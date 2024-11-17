import { WebSocketServer } from "ws";
import { parse as parseUrl } from "node:url";

const wss = new WebSocketServer({
  port: 8080,
});

const RGB_DATA_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d),(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d),(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;

let rgbData = "255,0,0";
let connectedUsers = 0;

function sendToAll(data) {
  wss.clients.forEach((client) => client.send(data));
}
function sendToUsers(data) {
  wss.clients.forEach((client) => !client.isEsp && client.send(data));
}

setInterval(() => {
  sendToUsers("users:" + connectedUsers);
}, 5000);

wss.on("connection", (ws, req) => {
  const { query } = parseUrl(req.url, true);
  ws.isEsp = "esp" in query;

  if (ws.isEsp) {
    console.log("ESP32 connected");
  } else {
    connectedUsers++;
    console.log("User connected");
  }

  ws.on("error", console.error);

  ws.on("message", (data) => {
    const strData = data.toString();
    if (RGB_DATA_REGEX.test(strData)) {
      rgbData = strData;
      sendToAll(rgbData);
    }
  });

  ws.on("close", () => {
    if (!ws.isEsp) {
      sendToUsers("users:" + --connectedUsers);
    }
  });

  ws.send(rgbData);
  sendToUsers("users:" + connectedUsers);
});
