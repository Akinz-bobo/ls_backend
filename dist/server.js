"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
//# sourceMappingURL=server.js.map