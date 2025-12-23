import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.IO for chat
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-broadcast", (broadcastId) => {
    socket.join(`broadcast-${broadcastId}`);
    console.log(`User ${socket.id} joined broadcast ${broadcastId}`);
  });

  socket.on("leave-broadcast", (broadcastId) => {
    socket.leave(`broadcast-${broadcastId}`);
    console.log(`User ${socket.id} left broadcast ${broadcastId}`);
  });

  socket.on("chat-message", (data) => {
    socket.to(`broadcast-${data.broadcastId}`).emit("chat-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});
