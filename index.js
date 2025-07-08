const express = require("express");
const db = require("./model/db");
db();
const User=require('./model/User')
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const app = express();

const corsOptions = {
  origin: "*", 
  methods: ["GET", "POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
const server = http.createServer(app);
app.use(express.json());
const authRoutes=require('./routes/authRoutes');
app.use("/api/auth",authRoutes);


const PORT=4000;





const { Server } = require("socket.io");
const io = new Server(server, {
   cors: corsOptions,
   transports:['websocket','polling'],
});


const users = {};
const editingTasks = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
    socket.on("joinRoom", (userId) => {
      users[userId] = socket.id;
      socket.userId = userId;
      console.log("Current users:", users);
      io.emit("onlineUsers", Object.keys(users));
    });
  
    socket.on("callUser", ({ from, to, signal }) => {
      const calleeSocketId = users[to];
      if (calleeSocketId) {
        io.to(calleeSocketId).emit("incomingCall", { from, signal });
        console.log(`Call from ${from} to ${to}`);
      } else {
        console.log(`User ${to} not found online`);
      }
    });
  
    socket.on("answerCall", ({ to, signal }) => {
      const callerSocketId = users[to];
      if (callerSocketId) {
        io.to(callerSocketId).emit("callAnswered", { signal });
        console.log(`Answer sent to ${to}`);
      }
    });
    socket.on("endCall", ({ to }) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
          io.to(targetSocketId).emit("callEnded");
          console.log(`End call sent to ${to}`);
        } else {
          console.log(`User ${to} not found online`);
        }
      });
      
    socket.on("sendIceCandidate", ({ to, candidate }) => {
      const targetSocketId = users[to];
      if (targetSocketId) {
        io.to(targetSocketId).emit("receiveIceCandidate", { candidate });
      }
    });
  socket.on("startEditingTask", ({ taskId, userName }) => {
  editingTasks[taskId] = userName;
  io.emit("taskEditingStatus", { taskId, editingBy: userName });
  console.log(`Task ${taskId} is being edited by ${userName}`);
});

socket.on("stopEditingTask", ({ taskId }) => {
  delete editingTasks[taskId];
  io.emit("taskEditingStatus", { taskId, editingBy: null });
  console.log(`Task ${taskId} edit released`);
});

    socket.on("disconnect", () => {
      if (socket.userId) {
        delete users[socket.userId];
        io.emit("onlineUsers", Object.keys(users));
        console.log("User disconnected:", socket.userId);
      };

       for (const [taskId, userName] of Object.entries(editingTasks)) {
      if (users[socket.userId] === userName) {
        delete editingTasks[taskId];
        io.emit("taskEditingStatus", { taskId, editingBy: null });
      }
    };
    });
  });
  
  app.get("/", (req, res) => {
    res.send("WebRTC signaling server is running.");
  });
  
server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  
