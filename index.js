//? DATA FORMAT = {"event":"message", "data":"ON"}
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Kafka = require('node-rdkafka')
const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const schema = require('./eventType')
const { v4: uuidv4 } = require('uuid');

const server_id = uuidv4().toString();

const Kstream = Kafka.Producer.createWriteStream({
    'metadata.broker.list': 'localhost:9092'//ip and port where kafka is running
}, {}, { topic: 'realyWsUid' });

const Kconsumer = Kafka.KafkaConsumer({
    'group.id': server_id,
    'metadata.broker.list': 'localhost:9092'//ip and port where kafka is running
}, {});

const clients = new Map(); // Map to hold UID to WebSocket set


Kconsumer.connect();

Kconsumer.on('ready', () => {
    console.log('Consumer ready....');
    Kconsumer.subscribe(['realyWsUid']);//fromBeginning: true || true for beginning : false for latest messages 
    Kconsumer.consume();
}).on('data', (data) => {
    console.log(`received message: ${schema.fromBuffer(data.value)}`);
    const brokerData = schema.fromBuffer(data.value);
    const { event,  MessageData, UID,serverID} = brokerData;
    console.log(event,MessageData,UID)
    // Check if the event is for a client join
    if (event === 'message' && serverID != server_id ) {
        // Find the WebSocket client for the UID
        const wsSet = clients.get(UID);
        if (wsSet) {
            // Forward the message to the WebSocket client
            const msg = JSON.stringify({ "event": "message", "data":MessageData  });
            wsSet.forEach((ws ) => {
                if (ws.readyState === WebSocket.OPEN ) {
                    ws.send(msg);
                }
            });
        }
    }
});

wss.on('connection', (ws) => {
    WS = ws;
    let userUID;
    console.log("New connction......")
    ws.on('message', (message) => {
        if (!userUID) {// if uid is empty
            console.log("UID : ", message.toString())
            // First message from client should be the UID
            userUID = message.toString();
            if (!clients.has(userUID)) {
                clients.set(userUID, new Set());
            }
            clients.get(userUID).add(ws);
            return;
        }

        // Relay message to all clients with the same UID
        if (clients.has(userUID)) {
            clients.get(userUID).forEach(client => {
                
                const obj = JSON.parse(message.toString())
                const sampleData = {
                    event: 'message',
                    serverID:server_id,
                    UID: userUID,
                    servo: 1,
                    MessageData: obj["data"]
                };
                if (client !== ws && client.readyState === WebSocket.OPEN) {// don't send to self and connection should be open
                    client.send(message);
          
                    const res = Kstream.write(schema.toBuffer(sampleData));
                    if (res)
                        console.log("Data relyed : ", message.toString())
                } else {
                    //write to kafka : means there is no ESP connected to this server(instance)
                    Kstream.write(schema.toBuffer(sampleData));
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

server.listen(8000, () => {
    console.log(`Server started on port ${server.address().port}`);
});
