import { MessageRepository, UserRepository } from '../../domain/repositories';
import { Message, User } from '../../domain/entities';
export declare class InMemoryMessageRepository implements MessageRepository {
    private messages;
    save(message: Message): Promise<Message>;
    findByBroadcastId(broadcastId: string, limit?: number): Promise<Message[]>;
    findById(id: string): Promise<Message | null>;
    updateLikes(id: string, likes: number): Promise<void>;
}
export declare class InMemoryUserRepository implements UserRepository {
    private users;
    save(socketId: string, user: User): Promise<void>;
    findBySocketId(socketId: string): Promise<User | null>;
    remove(socketId: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map