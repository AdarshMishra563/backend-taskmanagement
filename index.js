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




app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
const online=[];
let users = {}; // Keeps track of connected users by userId: socketId
console.log(users)
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    users[userId] = socket.id;  // Add the user to the users object
    socket.emit("yourID", socket.id);  // Emit the user's socket id
    console.log(users);
    // Emit the updated list of online users to all clients
    io.emit("onlineUsers",  Object.keys(users));
    console.log(users)  // Emit list of online user ids
  });

  socket.on("callUser", (data) => {
    const { from, to, signal } = data;
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("incomingCall", { from, signal });
    }
  });

  socket.on("answerCall", (data) => {
    const { to, signal } = data;
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callAnswered", { signal });
    }
  });
socket.on("onlineUsers",()=>{io.emit(users)})
  socket.on("disconnect", () => {
    // Find the user who disconnected and remove them from the users object
    for (let [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];  // Remove user from the online list
        break;
      }
    }

    // Emit the updated list of online users after someone disconnects
    io.emit("onlineUsers",online.push(Object.keys(users)) );
  });
});


server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  