import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map(); // roomId -> Map(socketId, username)

io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  let currentRoom = null;

  socket.on("join", ({ roomId, username }) => {
    if (!roomId || !username) return;

    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.id);
        io.to(currentRoom).emit("userJoin", Array.from(rooms.get(currentRoom).values()));
      }
    }

    // Join new room
    socket.join(roomId);
    currentRoom = roomId;

    // Store user
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(socket.id, username);

    console.log(`✅ ${username} joined room: ${roomId}`);

    // Send updated user list
    io.to(roomId).emit("userJoin", Array.from(rooms.get(roomId).values()));

    // Send current code if someone joins late
    if (rooms.get(roomId)?.code) {
      socket.emit("codeUpdate", rooms.get(roomId).code);
    }
  });

  socket.on("codeChange", ({ roomId, code }) => {
    if (!roomId || !code) return;
    console.log(`✏️ Code updated in room: ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { code: "" });
    }
    rooms.get(roomId).code = code; // Store latest code
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket.id);
      io.to(currentRoom).emit("userJoin", Array.from(rooms.get(currentRoom).values()));

      console.log(`❌ User disconnected: ${socket.id} from room: ${currentRoom}`);
    }
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/dist/index.html"));
});

server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
