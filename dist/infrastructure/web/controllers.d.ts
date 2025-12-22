import { Server, Socket } from 'socket.io';
import { UserRepository } from '../../domain/repositories';
import { SendMessageUseCase, GetChatHistoryUseCase, LikeMessageUseCase, JoinChatUseCase, LeaveChatUseCase, ModerateMessageUseCase } from '../../application/interfaces';
export declare class ChatSocketController {
    private io;
    private userRepo;
    private sendMessage;
    private getChatHistory;
    private likeMessage;
    private joinChat;
    private leaveChat;
    private moderateMessage;
    constructor(io: Server, userRepo: UserRepository, sendMessage: SendMessageUseCase, getChatHistory: GetChatHistoryUseCase, likeMessage: LikeMessageUseCase, joinChat: JoinChatUseCase, leaveChat: LeaveChatUseCase, moderateMessage: ModerateMessageUseCase);
    handleConnection(socket: Socket): void;
}
export declare class ChatHttpController {
    private getChatHistory;
    constructor(getChatHistory: GetChatHistoryUseCase);
    getHistory(broadcastId: string, limit?: number): Promise<{
        messages: import("../../domain/entities").Message[];
        success: boolean;
    }>;
}
//# sourceMappingURL=controllers.d.ts.map