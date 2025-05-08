const express = require("express");
const db = require("./model/db");
db();
const User=require('./model/User')
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
const server = http.createServer(app);
app.use(express.json());
const authRoutes=require('./routes/authRoutes');
app.use("/api/auth",authRoutes);


const PORT=4000 || 5000;





const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" }
});

// Track online users
const onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle joining a room
  socket.on("joinRoom", (userId) => {
    console.log(`User ${userId} joined`);
    socket.userId = userId;
    onlineUsers.add(userId);

    // Send updated list of online users to everyone
    io.emit("onlineUsers", Array.from(onlineUsers));
  });

  // Handle callUser event
  socket.on("callUser", ({ from, to, signal }) => {
    console.log(`Call from ${from} to ${to}`);
    // Find the socket of the callee
    for (let [id, s] of io.of("/").sockets) {
      if (s.userId === to) {
        io.to(s.id).emit("incomingCall", { from, signal });
        break;
      }
    }
  });

  // Handle answerCall event
  socket.on("answerCall", ({ to, signal }) => {
    console.log(`Answer to ${to}`);
    // Find the socket of the caller
    for (let [id, s] of io.of("/").sockets) {
      if (s.userId === to) {
        io.to(s.id).emit("callAnswered", { signal });
        break;
      }
    }
  });

  // Handle ICE Candidate exchange
  socket.on("sendIceCandidate", ({ to, candidate }) => {
    console.log(`ICE candidate sent to ${to}`);
    for (let [id, s] of io.of("/").sockets) {
      if (s.userId === to) {
        io.to(s.id).emit("receiveIceCandidate", { candidate });
        break;
      }
    }
  });

  // On disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
    onlineUsers.delete(socket.userId);
    io.emit("onlineUsers", Array.from(onlineUsers));
  });
});

// API endpoint to check server is running
app.get("/", (req, res) => {
  res.send("WebRTC signaling server is running.");
});

server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  