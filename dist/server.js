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
// Infrastructure
const repositories_1 = require("./infrastructure/repositories");
const controllers_1 = require("./infrastructure/web/controllers");
// Use Cases
const use_cases_1 = require("./application/use-cases");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// Dependency Injection
const messageRepo = new repositories_1.InMemoryMessageRepository();
const userRepo = new repositories_1.InMemoryUserRepository();
const sendMessage = new use_cases_1.SendMessage(messageRepo);
const getChatHistory = new use_cases_1.GetChatHistory(messageRepo);
const likeMessage = new use_cases_1.LikeMessage(messageRepo);
const joinChat = new use_cases_1.JoinChat(userRepo);
const leaveChat = new use_cases_1.LeaveChat(userRepo);
const moderateMessage = new use_cases_1.ModerateMessage(messageRepo);
// Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
const chatSocketController = new controllers_1.ChatSocketController(io, userRepo, sendMessage, getChatHistory, likeMessage, joinChat, leaveChat, moderateMessage);
const chatHttpController = new controllers_1.ChatHttpController(getChatHistory);
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'chat' });
});
app.get('/chat/:broadcastId/history', async (req, res) => {
    const { broadcastId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const result = await chatHttpController.getHistory(broadcastId, limit);
    res.json(result);
});
// Socket Events
io.on('connection', (socket) => {
    chatSocketController.handleConnection(socket);
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`💬 Chat Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map