const { Server } = require("socket.io");

let users = {}; // Track connected users by userId:socketId

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const updateUserList = () => {
    const userList = Object.keys(users);
    io.emit("updateUserList", userList); // broadcast to everyone
  };
  
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      users[userId] = socket.id;
      console.log(`User ${userId} joined with socket ${socket.id}`);
      socket.emit("yourID", socket.id);
      updateUserList();
    });

    socket.on("callUser", (data) => {
      const { from, to, signal } = data;
      const toSocketId = users[to];
      console.log(`${from} is calling ${to}`);
      if (toSocketId) {
        io.to(toSocketId).emit("incomingCall", { from, signal });
      }
    });

    socket.on("answerCall", (data) => {
      const { to, signal } = data;
      const toSocketId = users[to];
      console.log(`Call answered by ${socket.id} for ${to}`);
      if (toSocketId) {
        io.to(toSocketId).emit("callAnswered", { signal });
      }
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of Object.entries(users)) {
        if (socketId === socket.id) {
          console.log(`User ${userId} disconnected`);
          delete users[userId];
          updateUserList();
          break;
        }
      }
    });
  });
};

module.exports = socketHandler;
