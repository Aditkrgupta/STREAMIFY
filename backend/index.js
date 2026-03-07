const express = require("express");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log("server running on port", PORT);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);

  // join video room
  socket.on("room:join", (data) => {
    const { email, room } = data;

    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    socket.join(room);

    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", data);
  });

  // video call
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // chat message
  socket.on("chatMessage", ({ msg, roomId }) => {
    io.to(roomId).emit("chatMessage", msg);
  });

  // typing
  socket.on("typing", ({ userName, roomId }) => {
    socket.to(roomId).emit("typing", userName);
  });

  socket.on("stopTyping", ({ userName, roomId }) => {
    socket.to(roomId).emit("stopTyping", userName);
  });
});