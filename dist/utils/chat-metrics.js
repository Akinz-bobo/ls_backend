"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMetrics = void 0;
class ChatMetrics {
    constructor() {
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            messagesPerSecond: 0,
            roomCount: 0
        };
        this.messageCounters = new Map();
        this.lastResetTime = Date.now();
    }
    incrementConnections() {
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;
    }
    decrementActiveConnections() {
        this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    }
    incrementMessages(broadcastId) {
        const current = this.messageCounters.get(broadcastId) || 0;
        this.messageCounters.set(broadcastId, current + 1);
        this.updateMessagesPerSecond();
    }
    setRoomCount(count) {
        this.metrics.roomCount = count;
    }
    updateMessagesPerSecond() {
        const now = Date.now();
        const timeElapsed = now - this.lastResetTime;
        // Calculate messages per second over the last minute
        if (timeElapsed >= 60000) { // 1 minute
            const totalMessages = Array.from(this.messageCounters.values()).reduce((sum, count) => sum + count, 0);
            this.metrics.messagesPerSecond = Math.round((totalMessages / (timeElapsed / 1000)) * 10) / 10;
            // Reset counters
            this.messageCounters.clear();
            this.lastResetTime = now;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getRoomMetrics(broadcastId) {
        return {
            messageCount: this.messageCounters.get(broadcastId) || 0,
            lastActivity: new Date().toISOString()
        };
    }
    // Clean up old room metrics
    cleanupRoomMetrics(activeBroadcastIds) {
        this.messageCounters.forEach((_, broadcastId) => {
            if (!activeBroadcastIds.includes(broadcastId)) {
                this.messageCounters.delete(broadcastId);
            }
        });
    }
}
exports.chatMetrics = new ChatMetrics();
// Periodic cleanup and metrics reporting
setInterval(() => {
    console.log('📊 Chat Metrics:', exports.chatMetrics.getMetrics());
}, 30000); // Every 30 seconds
//# sourceMappingURL=chat-metrics.js.map