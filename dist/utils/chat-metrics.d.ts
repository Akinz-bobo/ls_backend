import { ConnectionMetrics } from '../types';
declare class ChatMetrics {
    private metrics;
    private messageCounters;
    private lastResetTime;
    incrementConnections(): void;
    decrementActiveConnections(): void;
    incrementMessages(broadcastId: string): void;
    setRoomCount(count: number): void;
    private updateMessagesPerSecond;
    getMetrics(): ConnectionMetrics;
    getRoomMetrics(broadcastId: string): {
        messageCount: number;
        lastActivity: string;
    };
    cleanupRoomMetrics(activeBroadcastIds: string[]): void;
}
export declare const chatMetrics: ChatMetrics;
export {};
//# sourceMappingURL=chat-metrics.d.ts.map