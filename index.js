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

// API to get users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Socket.IO
let users = {}; // userId: socketId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    users[userId] = socket.id;
    socket.emit("yourID", socket.id);
    io.emit("onlineUsers", Object.keys(users));
  });

  socket.on("callUser", ({ from, to, signal }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("incomingCall", { from, signal });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callAnswered", { signal });
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(users));
  });
});


server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  