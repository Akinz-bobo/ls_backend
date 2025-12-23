"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastUseCase = void 0;
class BroadcastUseCase {
    constructor(broadcastRepository) {
        this.broadcastRepository = broadcastRepository;
    }
    async getBroadcastStream(broadcastId) {
        const broadcast = await this.broadcastRepository.findById(broadcastId);
        if (!broadcast)
            return null;
        const isLive = broadcast.status === 'LIVE';
        return {
            broadcastId: broadcast.id,
            title: broadcast.title,
            isLive,
            host: {
                id: broadcast.hostId,
                firstName: '', // TODO: Get from host user
                lastName: ''
            },
            startTime: broadcast.startTime,
            endTime: broadcast.endTime,
            streamUrl: broadcast.streamUrl,
            signalingUrl: `/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`
        };
    }
    async startBroadcast(broadcastId, hostId) {
        const broadcast = await this.broadcastRepository.findById(broadcastId);
        if (!broadcast) {
            throw new Error('Broadcast not found');
        }
        if (broadcast.hostId !== hostId) {
            throw new Error('Only the host can start streaming');
        }
        return this.broadcastRepository.update(broadcastId, {
            status: 'LIVE',
            startTime: broadcast.startTime || new Date()
        });
    }
    async stopBroadcast(broadcastId, hostId) {
        const broadcast = await this.broadcastRepository.findById(broadcastId);
        if (!broadcast) {
            throw new Error('Broadcast not found');
        }
        if (broadcast.hostId !== hostId) {
            throw new Error('Only the host can stop streaming');
        }
        return this.broadcastRepository.update(broadcastId, {
            status: 'ENDED',
            endTime: new Date()
        });
    }
    async createBroadcast(broadcastData) {
        return this.broadcastRepository.create(broadcastData);
    }
}
exports.BroadcastUseCase = BroadcastUseCase;
//# sourceMappingURL=broadcast.use-case.js.map