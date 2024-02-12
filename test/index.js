const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "*", // Adjust according to your security requirements
  },
});

// Data structure to store UIDs and corresponding sockets
const clients = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle UID registration
  socket.on('register', (uid) => {
    clients[uid] = clients[uid] || [];
    clients[uid].push(socket);
    console.log(`Client registered with UID: ${uid}`);
  });

  // Relay message to clients with the same UID
  socket.on('message', (data) => {
    const { uid, message } = data;
    if (clients[uid]) {
      clients[uid].forEach(clientSocket => {
        if (clientSocket !== socket) {
          clientSocket.emit('message', message);
        }
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const uid in clients) {
      clients[uid] = clients[uid].filter(clientSocket => clientSocket !== socket);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});
