import { MessageRepository, UserRepository } from '../../domain/repositories';
import { Message, User } from '../../domain/entities';
import { SendMessageUseCase, GetChatHistoryUseCase, LikeMessageUseCase, JoinChatUseCase, LeaveChatUseCase, ModerateMessageUseCase } from '../interfaces';
interface SendMessageData {
    content: string;
    userId: string;
    username: string;
    userAvatar?: string;
    broadcastId: string;
    messageType?: string;
    replyTo?: string;
}
export declare class SendMessage implements SendMessageUseCase {
    private messageRepo;
    constructor(messageRepo: MessageRepository);
    execute(data: SendMessageData): Promise<Message>;
}
export declare class GetChatHistory implements GetChatHistoryUseCase {
    private messageRepo;
    constructor(messageRepo: MessageRepository);
    execute(broadcastId: string, limit?: number): Promise<Message[]>;
}
export declare class LikeMessage implements LikeMessageUseCase {
    private messageRepo;
    constructor(messageRepo: MessageRepository);
    execute(messageId: string, userId: string): Promise<Message | null>;
}
export declare class JoinChat implements JoinChatUseCase {
    private userRepo;
    constructor(userRepo: UserRepository);
    execute(socketId: string, user: User): Promise<void>;
}
export declare class LeaveChat implements LeaveChatUseCase {
    private userRepo;
    constructor(userRepo: UserRepository);
    execute(socketId: string): Promise<void>;
}
export declare class ModerateMessage implements ModerateMessageUseCase {
    private messageRepo;
    constructor(messageRepo: MessageRepository);
    execute(messageId: string, action: 'delete' | 'pin' | 'highlight' | 'unpin'): Promise<Message | null>;
}
export {};
//# sourceMappingURL=index.d.ts.map