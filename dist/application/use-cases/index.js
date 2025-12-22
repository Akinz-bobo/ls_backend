"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerateMessage = exports.LeaveChat = exports.JoinChat = exports.LikeMessage = exports.GetChatHistory = exports.SendMessage = void 0;
class SendMessage {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
    }
    async execute(data) {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: data.content,
            userId: data.userId,
            username: data.username,
            userAvatar: data.userAvatar,
            broadcastId: data.broadcastId,
            messageType: data.messageType || 'user',
            timestamp: new Date(),
            likes: 0,
            isPinned: false,
            isHighlighted: false,
            isModerated: false,
            replyTo: data.replyTo
        };
        return await this.messageRepo.save(message);
    }
}
exports.SendMessage = SendMessage;
class GetChatHistory {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
    }
    async execute(broadcastId, limit = 100) {
        return await this.messageRepo.findByBroadcastId(broadcastId, limit);
    }
}
exports.GetChatHistory = GetChatHistory;
class LikeMessage {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
    }
    async execute(messageId, userId) {
        const message = await this.messageRepo.findById(messageId);
        if (!message)
            return null;
        const newLikes = message.likes + 1;
        await this.messageRepo.updateLikes(messageId, newLikes);
        return { ...message, likes: newLikes };
    }
}
exports.LikeMessage = LikeMessage;
class JoinChat {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async execute(socketId, user) {
        await this.userRepo.save(socketId, user);
    }
}
exports.JoinChat = JoinChat;
class LeaveChat {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async execute(socketId) {
        await this.userRepo.remove(socketId);
    }
}
exports.LeaveChat = LeaveChat;
class ModerateMessage {
    constructor(messageRepo) {
        this.messageRepo = messageRepo;
    }
    async execute(messageId, action) {
        console.log(`🔨 ModerateMessage: ${action} on ${messageId}`);
        const message = await this.messageRepo.findById(messageId);
        if (!message) {
            console.log(`❌ Message ${messageId} not found`);
            return null;
        }
        const updates = {};
        switch (action) {
            case 'pin':
                updates.isPinned = true;
                console.log(`📌 Pinning message ${messageId}`);
                break;
            case 'unpin':
                updates.isPinned = false;
                console.log(`📌 Unpinning message ${messageId}`);
                break;
            case 'highlight':
                updates.isHighlighted = true;
                console.log(`✨ Highlighting message ${messageId}`);
                break;
            case 'delete':
                updates.isModerated = true;
                console.log(`🗑️ Deleting message ${messageId}`);
                break;
        }
        Object.assign(message, updates);
        const result = await this.messageRepo.save(message);
        console.log(`✅ Message ${messageId} updated: isPinned=${result.isPinned}`);
        return result;
    }
}
exports.ModerateMessage = ModerateMessage;
//# sourceMappingURL=index.js.map