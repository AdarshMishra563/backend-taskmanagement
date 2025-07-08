const express = require("express");
const db = require("./model/db");
db();
const User=require('./model/User')
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const app = express();

const corsOptions = {
  origin: [
    "https://frontend-taskmanagement-kohl.vercel.app",
    "http://localhost:3000" 
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};
app.options('*', cors(corsOptions));
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
const userDetails = {};  
const editingTasks = {}; 

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
 
  socket.on("joinRoom", ({ userId, email }) => {
    users[userId] = socket.id;
    userDetails[socket.id] = { userId, email };
    socket.userId = userId;
    socket.userEmail = email;
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


socket.on("startEditingTask", ({ taskId, useremail }) => {
    try {
      const currentEditor = editingTasks[taskId];

      if (currentEditor) {
        if (currentEditor !== useremail) {
        
          socket.emit("taskEditingStatus", {
            taskId,
            editingBy: currentEditor,
            conflict: true,
            attemptedBy: useremail
          });

          
          const editorSocketId = Object.keys(userDetails).find(
            socketId => userDetails[socketId].email === currentEditor
          );
          
          if (editorSocketId) {
            io.to(editorSocketId).emit("taskEditingConflict", {
              taskId,
              attemptedBy: useremail
            });
          }

          console.log(
            `User ${useremail} tried editing task ${taskId} already being edited by ${currentEditor}`
          );
        }
        return;
      }

      
      editingTasks[taskId] = useremail;
      socket.userEmail = useremail;

     
      io.emit("taskEditingStatus", {
        taskId,
        editingBy: useremail,
        conflict: false
      });

      console.log(`Task ${taskId} is being edited by ${useremail}`);
    } catch (error) {
      console.error("Error in startEditingTask:", error);
    }
  });

  socket.on("stopEditingTask", ({ taskId, useremail }) => {
    try {
      if (editingTasks[taskId] === useremail) {
        delete editingTasks[taskId];
        io.emit("taskEditingStopped", { taskId });
        console.log(`${useremail} stopped editing task ${taskId}`);
      }
    } catch (error) {
      console.error("Error in stopEditingTask:", error);
    }
  });

  socket.on("disconnect", () => {
    try {
      
      if (socket.userId) {
        delete users[socket.userId];
        io.emit("onlineUsers", Object.keys(users));
        console.log("User disconnected:", socket.userId);
      }


      if (socket.userEmail) {
        for (const [taskId, email] of Object.entries(editingTasks)) {
          if (email === socket.userEmail) {
            delete editingTasks[taskId];
            io.emit("taskEditingStatus", { taskId, editingBy: null });
            console.log(`Cleaned up editing task ${taskId} from disconnected user`);
          }
        }
      }

     
      delete userDetails[socket.id];
    } catch (error) {
      console.error("Error during disconnect cleanup:", error);
    }
  });
  });
  
  app.get("/", (req, res) => {
    res.send("WebRTC signaling server is running now .");
  });
  
server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  
