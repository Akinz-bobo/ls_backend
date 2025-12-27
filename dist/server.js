"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const broadcast_sse_manager_1 = __importDefault(require("./infrastructure/sse/broadcast-sse-manager"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
// Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
// Routes
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "chat" });
});
// SSE endpoint for broadcast notifications
app.get("/api/broadcasts/events", (req, res) => {
    const clientId = `client-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
    console.log(`🔗 [SSE] New client connecting: ${clientId}`);
    broadcast_sse_manager_1.default.addClient(res, clientId);
});
// Get active SSE connections count (for monitoring)
app.get("/api/broadcasts/events/stats", (req, res) => {
    res.json({
        activeConnections: broadcast_sse_manager_1.default.getActiveClientCount(),
        timestamp: new Date().toISOString(),
    });
});
// Notify backend that a broadcast started
app.post("/api/broadcasts/notify/started", (req, res) => {
    try {
        const broadcastData = req.body;
        console.log("📢 [Backend] Received broadcast started notification:", {
            id: broadcastData.id,
            title: broadcastData.title,
        });
        broadcast_sse_manager_1.default.broadcastStarted(broadcastData.id, broadcastData);
        res.json({
            success: true,
            message: "Broadcast started event sent to all clients",
        });
    }
    catch (error) {
        console.error("❌ [Backend] Error handling broadcast started notification:", error);
        res.status(500).json({ error: "Failed to send broadcast event" });
    }
});
// Notify backend that a broadcast ended
app.post("/api/broadcasts/notify/ended", (req, res) => {
    try {
        const broadcastData = req.body;
        console.log("📢 [Backend] Received broadcast ended notification:", {
            id: broadcastData.id,
            title: broadcastData.title,
        });
        broadcast_sse_manager_1.default.broadcastEnded(broadcastData.id, broadcastData);
        res.json({
            success: true,
            message: "Broadcast ended event sent to all clients",
        });
    }
    catch (error) {
        console.error("❌ [Backend] Error handling broadcast ended notification:", error);
        res.status(500).json({ error: "Failed to send broadcast event" });
    }
});
// Basic chat functionality
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
    console.log(`💬 Chat Server running on port ${PORT}`);
    console.log(`📡 SSE Broadcast Events available at http://localhost:${PORT}/api/broadcasts/events`);
});
//# sourceMappingURL=server.js.map