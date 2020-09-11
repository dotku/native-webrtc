const cors = require('cors');
const express = require("express");
const fs = require('fs');
const http = require("http");
const https = require('https');
const options = {
    key: fs.readFileSync('client/.cert/key.pem'),
    cert: fs.readFileSync('client/.cert/cert.pem')
};

const app = express();
const server = https.createServer(options, app);
const socket = require("socket.io");
const io = socket(server);

const rooms = {};
app.use(cors());
app.get("/", (req, res) => {
    res.send("hello, starnger, let's get to know each other.");
})
app.get("/rooms", (req, res) => {
    res.send({
        rooms
    })
})
io.on("connection", socket => {
    socket.on("join room", roomID => {
        // console.log("join room");
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    socket.on("offer", payload => {
        // console.log("offer");
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        // console.log("answer");
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        // console.log("ice-candidate");
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});


server.listen(8000, () => console.log('server is running on port 8000'));
