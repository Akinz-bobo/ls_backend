"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = exports.InMemoryMessageRepository = void 0;
class InMemoryMessageRepository {
    constructor() {
        this.messages = [];
    }
    async save(message) {
        const existingIndex = this.messages.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
            console.log(`📝 Updating existing message ${message.id}`);
            this.messages[existingIndex] = message;
        }
        else {
            console.log(`➕ Adding new message ${message.id} to broadcast ${message.broadcastId}`);
            this.messages.push(message);
            if (this.messages.length > 1000) {
                this.messages = this.messages.slice(-1000);
            }
        }
        console.log(`💾 Total messages in repo: ${this.messages.length}`);
        return message;
    }
    async findByBroadcastId(broadcastId, limit = 100) {
        const filtered = this.messages.filter(m => m.broadcastId === broadcastId);
        const result = filtered.slice(-limit);
        console.log(`🔍 Found ${result.length} messages for broadcast ${broadcastId} (total: ${this.messages.length})`);
        return result;
    }
    async findById(id) {
        const message = this.messages.find(m => m.id === id) || null;
        console.log(`🔍 Finding message ${id}: ${message ? 'found' : 'not found'}`);
        return message;
    }
    async updateLikes(id, likes) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            message.likes = likes;
        }
    }
}
exports.InMemoryMessageRepository = InMemoryMessageRepository;
class InMemoryUserRepository {
    constructor() {
        this.users = new Map();
    }
    async save(socketId, user) {
        console.log(`👤 Saving user ${user.username} with role ${user.role} for socket ${socketId}`);
        this.users.set(socketId, user);
    }
    async findBySocketId(socketId) {
        const user = this.users.get(socketId) || null;
        console.log(`🔍 Finding user for socket ${socketId}: ${user ? `${user.username} (${user.role})` : 'not found'}`);
        return user;
    }
    async remove(socketId) {
        this.users.delete(socketId);
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;
//# sourceMappingURL=index.js.map