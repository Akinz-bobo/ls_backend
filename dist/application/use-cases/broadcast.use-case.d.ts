import { IBroadcastRepository } from '../../domain/repositories';
import { BroadcastStreamDTO } from '../dto';
import { LiveBroadcast } from '../../domain/entities';
export declare class BroadcastUseCase {
    private broadcastRepository;
    constructor(broadcastRepository: IBroadcastRepository);
    getBroadcastStream(broadcastId: string): Promise<BroadcastStreamDTO | null>;
    startBroadcast(broadcastId: string, hostId: string): Promise<LiveBroadcast>;
    stopBroadcast(broadcastId: string, hostId: string): Promise<LiveBroadcast>;
    createBroadcast(broadcastData: Omit<LiveBroadcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveBroadcast>;
}
//# sourceMappingURL=broadcast.use-case.d.ts.map