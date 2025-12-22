"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHttpController = exports.ChatSocketController = void 0;
class ChatSocketController {
    constructor(io, userRepo, sendMessage, getChatHistory, likeMessage, joinChat, leaveChat, moderateMessage) {
        this.io = io;
        this.userRepo = userRepo;
        this.sendMessage = sendMessage;
        this.getChatHistory = getChatHistory;
        this.likeMessage = likeMessage;
        this.joinChat = joinChat;
        this.leaveChat = leaveChat;
        this.moderateMessage = moderateMessage;
    }
    handleConnection(socket) {
        socket.on('join-chat', async (broadcastId, user) => {
            console.log(`💬 User ${user.username} joining chat for broadcast ${broadcastId}`);
            socket.join(`chat:${broadcastId}`);
            await this.joinChat.execute(socket.id, user);
            const messages = await this.getChatHistory.execute(broadcastId, 100);
            console.log(`📜 Sending ${messages.length} messages to ${user.username}`);
            socket.emit('chat:history', { messages });
        });
        socket.on('chat:message', async (data) => {
            console.log(`💬 New message from socket ${socket.id}: "${data.content}"`);
            const user = await this.userRepo.findBySocketId(socket.id);
            if (!user) {
                console.log(`❌ No user found for socket ${socket.id}`);
                return;
            }
            const message = await this.sendMessage.execute({
                content: data.content,
                userId: user.id,
                username: user.username,
                userAvatar: user.avatar,
                broadcastId: data.broadcastId,
                messageType: data.messageType || 'user',
                replyTo: data.replyTo
            });
            console.log(`📡 Broadcasting message ${message.id} to chat:${data.broadcastId}`);
            this.io.to(`chat:${data.broadcastId}`).emit('chat:message', message);
        });
        socket.on('chat:typing', async (data) => {
            const user = await this.userRepo.findBySocketId(socket.id);
            if (!user)
                return;
            socket.to(`chat:${data.broadcastId}`).emit('chat:typing', {
                userId: user.id,
                username: user.username,
                isTyping: data.isTyping
            });
        });
        socket.on('chat:like', async (data) => {
            const user = await this.userRepo.findBySocketId(socket.id);
            if (!user)
                return;
            const message = await this.likeMessage.execute(data.messageId, user.id);
            if (message) {
                this.io.emit('chat:message_liked', {
                    messageId: data.messageId,
                    likes: message.likes
                });
            }
        });
        socket.on('chat:moderate', async (data) => {
            console.log(`🔨 Moderation request: ${data.action} on message ${data.messageId}`);
            const user = await this.userRepo.findBySocketId(socket.id);
            if (!user || !['host', 'moderator'].includes(user.role)) {
                console.log(`❌ Moderation denied for user ${user?.username || 'unknown'} with role ${user?.role || 'none'}`);
                return;
            }
            const moderatedMessage = await this.moderateMessage.execute(data.messageId, data.action);
            if (moderatedMessage) {
                console.log(`✅ Message ${data.messageId} moderated: ${data.action}, isPinned: ${moderatedMessage.isPinned}`);
                this.io.emit('chat:message_moderated', {
                    messageId: data.messageId,
                    action: data.action,
                    isPinned: moderatedMessage.isPinned,
                    isHighlighted: moderatedMessage.isHighlighted,
                    isModerated: moderatedMessage.isModerated
                });
            }
            else {
                console.log(`❌ Failed to moderate message ${data.messageId}`);
            }
        });
        socket.on('disconnect', async () => {
            await this.leaveChat.execute(socket.id);
        });
    }
}
exports.ChatSocketController = ChatSocketController;
class ChatHttpController {
    constructor(getChatHistory) {
        this.getChatHistory = getChatHistory;
    }
    async getHistory(broadcastId, limit) {
        const messages = await this.getChatHistory.execute(broadcastId, limit);
        return { messages, success: true };
    }
}
exports.ChatHttpController = ChatHttpController;
//# sourceMappingURL=controllers.js.map