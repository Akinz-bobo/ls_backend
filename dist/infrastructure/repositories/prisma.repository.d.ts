import { IUserRepository, IStaffRepository, IPodcastRepository, IBroadcastRepository } from '../../domain/repositories';
import { User, Staff, Podcast, LiveBroadcast } from '../../domain/entities';
export declare class PrismaUserRepository implements IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
}
export declare class PrismaStaffRepository implements IStaffRepository {
    findById(id: string): Promise<Staff | null>;
    findByUserId(userId: string): Promise<Staff | null>;
}
export declare class PrismaPodcastRepository implements IPodcastRepository {
    findAll(): Promise<Podcast[]>;
    findById(id: string): Promise<Podcast | null>;
    create(podcast: Omit<Podcast, 'id' | 'createdAt'>): Promise<Podcast>;
}
export declare class PrismaBroadcastRepository implements IBroadcastRepository {
    findAll(): Promise<LiveBroadcast[]>;
    findById(id: string): Promise<LiveBroadcast | null>;
    findLive(): Promise<LiveBroadcast[]>;
    create(broadcast: Omit<LiveBroadcast, 'id'>): Promise<LiveBroadcast>;
    update(id: string, data: Partial<LiveBroadcast>): Promise<LiveBroadcast>;
}
//# sourceMappingURL=prisma.repository.d.ts.map