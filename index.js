//? DATA FORMAT = {"event":"message", "data":"ON"}
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const clients = new Map(); // Map to hold UID to WebSocket set

wss.on('connection', (ws) => {
  let userUID;
console.log("New connction......")
  ws.on('message', (message) => {
    if (!userUID) {
      console.log("UID : ", message.toString())
      // First message from client should be the UID
      userUID =  message.toString();
      if (!clients.has(userUID)) {
        clients.set(userUID, new Set());
      }
      clients.get(userUID).add(ws);
      return;
    }

    // Relay message to all clients with the same UID
    if (clients.has(userUID)) {
      clients.get(userUID).forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
          console.log("Data relyed : ", message.toString())
        }
      });
    }
  });

  ws.on('close', () => {
    if (userUID && clients.has(userUID)) {
      clients.get(userUID).delete(ws);
      if (clients.get(userUID).size === 0) {
        clients.delete(userUID);
      }
    }
  });
});

server.listen(3300, () => {
  console.log(`Server started on port ${server.address().port}`);
});
