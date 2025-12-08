"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatHandler;
const chat_metrics_1 = require("../utils/chat-metrics");
// In-memory storage (should be replaced with Redis in production)
const chatRooms = new Map();
const userSessions = new Map();
const typingTimeouts = new Map();
const moderationActions = new Map();
// Connection metrics
const metrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesPerSecond: 0,
    roomCount: 0
};
// Helper functions for better code organization
function createErrorResponse(error, code) {
    return {
        error,
        code,
        timestamp: new Date().toISOString()
    };
}
function createSuccessResponse(message, data) {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
}
function validateMessageContent(content, maxLength) {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }
    if (content.length > maxLength) {
        return { valid: false, error: `Message too long. Maximum ${maxLength} characters.` };
    }
    return { valid: true };
}
function checkRateLimit(user, slowModeSeconds) {
    if (user.role !== 'listener' || slowModeSeconds === 0) {
        return { allowed: true };
    }
    const timeSinceLastMessage = Date.now() - (user.lastMessageTime || 0);
    if (timeSinceLastMessage < slowModeSeconds * 1000) {
        const waitTime = Math.ceil((slowModeSeconds * 1000 - timeSinceLastMessage) / 1000);
        return { allowed: false, waitTime };
    }
    return { allowed: true };
}
function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function chatHandler(io) {
    // Track connection metrics
    io.on('connection', (socket) => {
        chat_metrics_1.chatMetrics.incrementConnections();
        console.log(`💬 Chat client connected: ${socket.id} (Active: ${chat_metrics_1.chatMetrics.getMetrics().activeConnections})`);
        // Handle connection errors
        socket.on('error', (error) => {
            console.error(`🚨 Socket error for ${socket.id}:`, error);
            socket.emit('chat-error', createErrorResponse('Connection error', 'CONNECTION_ERROR'));
        });
        // Send connection acknowledgment
        socket.emit('chat-connected', createSuccessResponse('Connected to chat server'));
        socket.on('join-chat', async (broadcastId, userInfo) => {
            try {
                if (!broadcastId || typeof broadcastId !== 'string') {
                    socket.emit('chat-error', createErrorResponse('Invalid broadcast ID', 'INVALID_BROADCAST_ID'));
                    return;
                }
                if (!userInfo?.username) {
                    socket.emit('chat-error', createErrorResponse('Username is required', 'MISSING_USERNAME'));
                    return;
                }
                console.log('👤 User joining chat:', broadcastId, userInfo);
                // Join socket room
                await socket.join(`chat-${broadcastId}`);
                // Initialize room if it doesn't exist
                if (!chatRooms.has(broadcastId)) {
                    const room = {
                        messages: [],
                        users: new Map(),
                        typingUsers: new Map(),
                        settings: {
                            slowMode: 0,
                            maxMessageLength: 500,
                            allowEmojis: true,
                            moderationEnabled: true
                        },
                        stats: {
                            totalMessages: 0,
                            totalUsers: 0,
                            createdAt: new Date()
                        }
                    };
                    chatRooms.set(broadcastId, room);
                    moderationActions.set(broadcastId, []);
                    chat_metrics_1.chatMetrics.setRoomCount(chatRooms.size);
                }
                const room = chatRooms.get(broadcastId);
                // Check if user is banned
                const actions = moderationActions.get(broadcastId) || [];
                const banAction = actions.find(a => a.userId === userInfo.userId && a.action === 'ban');
                if (banAction) {
                    socket.emit('chat-error', createErrorResponse('You are banned from this chat', 'USER_BANNED'));
                    return;
                }
                const user = {
                    id: socket.id,
                    userId: userInfo.userId || socket.id,
                    username: userInfo.username,
                    role: userInfo.role || 'listener',
                    avatar: userInfo.avatar,
                    joinedAt: new Date(),
                    lastActivity: new Date(),
                    messageCount: 0,
                    isTyping: false,
                    isMuted: false,
                    isBanned: false
                };
                room.users.set(socket.id, user);
                userSessions.set(socket.id, {
                    userId: user.userId,
                    username: user.username,
                    broadcastId,
                    joinTime: new Date(),
                    messageCount: 0
                });
                room.stats.totalUsers++;
                // Send chat history and room info
                socket.emit('chat-joined', createSuccessResponse('Joined chat successfully', {
                    broadcastId,
                    messages: room.messages.slice(-50),
                    settings: room.settings,
                    userCount: room.users.size,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        avatar: user.avatar
                    }
                }));
                // Send updated user list to everyone
                io.to(`chat-${broadcastId}`).emit('users-updated', {
                    users: Array.from(room.users.values()).map((u) => ({
                        id: u.id,
                        username: u.username,
                        role: u.role,
                        avatar: u.avatar,
                        isTyping: u.isTyping
                    })),
                    count: room.users.size
                });
                // Notify others about new user
                socket.to(`chat-${broadcastId}`).emit('user-joined', {
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        avatar: user.avatar
                    },
                    userCount: room.users.size,
                    timestamp: new Date().toISOString()
                });
                console.log(`👥 User ${user.username} joined chat ${broadcastId} (${room.users.size} total users)`);
            }
            catch (error) {
                console.error('Error in join-chat:', error);
                socket.emit('chat-error', createErrorResponse('Failed to join chat', 'JOIN_FAILED'));
            }
        });
        socket.on('send-message', async (broadcastId, messageData) => {
            try {
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('message-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                if (user.isMuted || user.isBanned) {
                    socket.emit('message-error', createErrorResponse('You are muted or banned', 'USER_RESTRICTED'));
                    return;
                }
                const content = messageData.content?.trim();
                const validation = validateMessageContent(content, room.settings.maxMessageLength);
                if (!validation.valid) {
                    socket.emit('message-error', createErrorResponse(validation.error, 'INVALID_CONTENT'));
                    return;
                }
                // Rate limiting check
                const rateLimitCheck = checkRateLimit(user, room.settings.slowMode);
                if (!rateLimitCheck.allowed) {
                    socket.emit('message-error', createErrorResponse(`Slow mode enabled. Please wait ${rateLimitCheck.waitTime} seconds.`, 'RATE_LIMITED'));
                    return;
                }
                // Clear typing indicator
                if (room.typingUsers.has(socket.id)) {
                    room.typingUsers.delete(socket.id);
                    user.isTyping = false;
                    socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                        userId: socket.id,
                        username: user.username,
                        timestamp: new Date().toISOString()
                    });
                }
                if (typingTimeouts.has(socket.id)) {
                    clearTimeout(typingTimeouts.get(socket.id));
                    typingTimeouts.delete(socket.id);
                }
                const messageId = generateMessageId();
                const message = {
                    id: messageId,
                    userId: user.userId,
                    username: user.username,
                    content: content,
                    messageType: messageData.messageType || 'user',
                    role: user.role,
                    avatar: user.avatar,
                    timestamp: new Date(),
                    socketId: socket.id,
                    likes: 0,
                    likedBy: [],
                    reactions: {},
                    isEdited: false,
                    isDeleted: false,
                    isPinned: false,
                    replyTo: messageData.replyTo
                };
                room.messages.push(message);
                room.stats.totalMessages++;
                chat_metrics_1.chatMetrics.incrementMessages(broadcastId);
                user.messageCount++;
                user.lastActivity = new Date();
                user.lastMessageTime = Date.now();
                const session = userSessions.get(socket.id);
                if (session) {
                    session.messageCount++;
                }
                // Maintain message history limit
                if (room.messages.length > 200) {
                    room.messages = room.messages.slice(-200);
                }
                // Broadcast message to all users in the room
                io.to(`chat-${broadcastId}`).emit('new-message', {
                    ...message,
                    broadcastId,
                    userCount: room.users.size,
                    totalMessages: room.stats.totalMessages
                });
                // Send confirmation to sender
                socket.emit('message-sent', createSuccessResponse('Message sent successfully', { messageId }));
                console.log(`💬 Message from ${user.username} in ${broadcastId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
            }
            catch (error) {
                console.error('Error in send-message:', error);
                socket.emit('message-error', createErrorResponse('Failed to send message', 'SEND_FAILED'));
            }
        });
        socket.on('send-announcement', (broadcastId, announcementData) => {
            try {
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('message-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                // Check if user has permission to send announcements
                if (!announcementData.isStaff && !['host', 'moderator', 'admin'].includes(user.role)) {
                    socket.emit('message-error', createErrorResponse('Insufficient permissions', 'PERMISSION_DENIED'));
                    return;
                }
                if (!announcementData.content?.trim()) {
                    socket.emit('message-error', createErrorResponse('Announcement content is required', 'INVALID_CONTENT'));
                    return;
                }
                const announcement = {
                    id: generateMessageId(),
                    userId: user.userId,
                    username: announcementData.username || user.username,
                    content: announcementData.content.trim(),
                    messageType: 'announcement',
                    role: user.role,
                    avatar: user.avatar,
                    timestamp: new Date(),
                    socketId: socket.id,
                    likes: 0,
                    likedBy: [],
                    reactions: {},
                    isEdited: false,
                    isDeleted: false,
                    isPinned: false
                };
                room.messages.push(announcement);
                room.stats.totalMessages++;
                // Broadcast announcement
                io.to(`chat-${broadcastId}`).emit('new-message', {
                    ...announcement,
                    broadcastId
                });
                socket.emit('message-sent', createSuccessResponse('Announcement sent successfully', { messageId: announcement.id }));
                console.log(`📢 Announcement from ${user.username} in ${broadcastId}: ${announcement.content.substring(0, 50)}`);
            }
            catch (error) {
                console.error('Error sending announcement:', error);
                socket.emit('message-error', createErrorResponse('Failed to send announcement', 'ANNOUNCEMENT_FAILED'));
            }
        });
        // New moderation endpoints
        socket.on('moderate-message', (data) => {
            try {
                const { messageId, action, broadcastId, reason } = data;
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('moderation-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                if (!['host', 'moderator', 'admin'].includes(user.role)) {
                    socket.emit('moderation-error', createErrorResponse('Insufficient permissions', 'PERMISSION_DENIED'));
                    return;
                }
                const message = room.messages.find(msg => msg.id === messageId);
                if (!message) {
                    socket.emit('moderation-error', createErrorResponse('Message not found', 'MESSAGE_NOT_FOUND'));
                    return;
                }
                switch (action) {
                    case 'pin':
                        // Unpin other pinned messages first
                        room.messages.forEach(msg => { if (msg.isPinned)
                            msg.isPinned = false; });
                        message.isPinned = true;
                        break;
                    case 'unpin':
                        message.isPinned = false;
                        break;
                    case 'delete':
                        const messageIndex = room.messages.findIndex(msg => msg.id === messageId);
                        if (messageIndex !== -1) {
                            room.messages.splice(messageIndex, 1);
                        }
                        break;
                    case 'highlight':
                        // Toggle highlight
                        message.isEdited = !message.isEdited; // Using isEdited as highlight flag temporarily
                        break;
                }
                io.to(`chat-${broadcastId}`).emit('message-moderated', {
                    messageId,
                    action,
                    moderatedBy: user.username,
                    reason,
                    timestamp: new Date().toISOString(),
                    message: action === 'delete' ? null : message
                });
                socket.emit('moderation-success', createSuccessResponse(`Message ${action}ed successfully`));
                console.log(`🛡️ Message ${action}ed by ${user.username} in ${broadcastId}: ${messageId}`);
            }
            catch (error) {
                console.error('Error moderating message:', error);
                socket.emit('moderation-error', createErrorResponse('Failed to moderate message', 'MODERATION_FAILED'));
            }
        });
        socket.on('moderate-user', (data) => {
            try {
                const { userId, action, broadcastId, reason, duration } = data;
                const room = chatRooms.get(broadcastId);
                const moderator = room?.users.get(socket.id);
                if (!room || !moderator) {
                    socket.emit('moderation-error', createErrorResponse('Room or moderator not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                if (!['host', 'moderator', 'admin'].includes(moderator.role)) {
                    socket.emit('moderation-error', createErrorResponse('Insufficient permissions', 'PERMISSION_DENIED'));
                    return;
                }
                // Find target user by userId (not socket ID)
                let targetUser;
                let targetSocketId;
                room.users.forEach((user, socketId) => {
                    if (user.userId === userId) {
                        targetUser = user;
                        targetSocketId = socketId;
                    }
                });
                if (!targetUser || !targetSocketId) {
                    socket.emit('moderation-error', createErrorResponse('User not found', 'USER_NOT_FOUND'));
                    return;
                }
                // Don't allow moderating users with equal or higher roles
                const roleHierarchy = { listener: 0, host: 1, moderator: 2, admin: 3 };
                if (roleHierarchy[targetUser.role] >= roleHierarchy[moderator.role]) {
                    socket.emit('moderation-error', createErrorResponse('Cannot moderate user with equal or higher permissions', 'PERMISSION_DENIED'));
                    return;
                }
                const moderationAction = {
                    action: action,
                    userId: targetUser.userId,
                    moderatorId: moderator.userId,
                    reason,
                    duration,
                    timestamp: new Date()
                };
                const actions = moderationActions.get(broadcastId) || [];
                actions.push(moderationAction);
                moderationActions.set(broadcastId, actions);
                switch (action) {
                    case 'ban':
                        targetUser.isBanned = true;
                        // Remove user from room
                        room.users.delete(targetSocketId);
                        io.to(targetSocketId).emit('user-banned', { reason, moderator: moderator.username });
                        io.sockets.sockets.get(targetSocketId)?.leave(`chat-${broadcastId}`);
                        break;
                    case 'unban':
                        targetUser.isBanned = false;
                        break;
                    case 'mute':
                        targetUser.isMuted = true;
                        if (duration) {
                            setTimeout(() => {
                                targetUser.isMuted = false;
                                io.to(`chat-${broadcastId}`).emit('user-unmuted', {
                                    userId: targetUser.userId,
                                    username: targetUser.username,
                                    automatic: true
                                });
                            }, duration * 60 * 1000);
                        }
                        break;
                    case 'unmute':
                        targetUser.isMuted = false;
                        break;
                    case 'timeout':
                        targetUser.isMuted = true;
                        if (duration) {
                            setTimeout(() => {
                                targetUser.isMuted = false;
                                io.to(`chat-${broadcastId}`).emit('user-unmuted', {
                                    userId: targetUser.userId,
                                    username: targetUser.username,
                                    automatic: true
                                });
                            }, duration * 60 * 1000);
                        }
                        break;
                }
                io.to(`chat-${broadcastId}`).emit('user-moderated', {
                    userId: targetUser.userId,
                    username: targetUser.username,
                    action,
                    moderatedBy: moderator.username,
                    reason,
                    duration,
                    timestamp: new Date().toISOString()
                });
                socket.emit('moderation-success', createSuccessResponse(`User ${action}ed successfully`));
                console.log(`🛡️ User ${action}ed by ${moderator.username} in ${broadcastId}: ${targetUser.username}`);
            }
            catch (error) {
                console.error('Error moderating user:', error);
                socket.emit('moderation-error', createErrorResponse('Failed to moderate user', 'MODERATION_FAILED'));
            }
        });
        socket.on('like-message', (data) => {
            try {
                const { messageId, broadcastId } = data;
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('message-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                const message = room.messages.find(msg => msg.id === messageId);
                if (!message) {
                    socket.emit('message-error', createErrorResponse('Message not found', 'MESSAGE_NOT_FOUND'));
                    return;
                }
                const userHasLiked = message.likedBy.includes(user.userId);
                if (userHasLiked) {
                    // Unlike
                    message.likedBy = message.likedBy.filter(id => id !== user.userId);
                    message.likes--;
                }
                else {
                    // Like
                    message.likedBy.push(user.userId);
                    message.likes++;
                }
                io.to(`chat-${broadcastId}`).emit('message-updated', {
                    messageId,
                    updates: {
                        likes: message.likes,
                        likedBy: message.likedBy
                    }
                });
                socket.emit('like-success', createSuccessResponse(userHasLiked ? 'Message unliked' : 'Message liked'));
            }
            catch (error) {
                console.error('Error liking message:', error);
                socket.emit('message-error', createErrorResponse('Failed to like message', 'LIKE_FAILED'));
            }
        });
        // Handle broadcast status changes
        socket.on('broadcast-status-change', (data) => {
            try {
                const { broadcastId, isLive, timestamp } = data;
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('chat-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                // Only allow hosts/moderators to change broadcast status
                if (!['host', 'moderator', 'admin'].includes(user.role)) {
                    socket.emit('chat-error', createErrorResponse('Only hosts can change broadcast status', 'PERMISSION_DENIED'));
                    return;
                }
                console.log(`📻 Broadcast status changed by ${user.username}: ${isLive ? 'LIVE' : 'OFFLINE'}`, data);
                // Notify all users in the room about broadcast status change
                io.to(`chat-${broadcastId}`).emit('broadcast-status-updated', {
                    broadcastId,
                    isLive,
                    changedBy: user.username,
                    timestamp,
                    message: isLive
                        ? `📻 ${user.username} started the broadcast - Chat is now live!`
                        : `📻 Broadcast ended - Chat remains open for discussion`
                });
                // Add system message about status change
                const statusMessage = {
                    id: generateMessageId(),
                    userId: 'system',
                    username: 'System',
                    content: isLive
                        ? `🎤 Broadcast is now LIVE! Welcome to the chat.`
                        : `📻 Broadcast has ended. Thanks for listening!`,
                    messageType: 'system',
                    role: 'listener',
                    timestamp: new Date(),
                    socketId: socket.id,
                    likes: 0,
                    likedBy: [],
                    reactions: {},
                    isEdited: false,
                    isDeleted: false,
                    isPinned: false
                };
                room.messages.push(statusMessage);
                room.stats.totalMessages++;
                io.to(`chat-${broadcastId}`).emit('new-message', {
                    ...statusMessage,
                    broadcastId
                });
                socket.emit('broadcast-status-success', createSuccessResponse(`Broadcast status updated to ${isLive ? 'LIVE' : 'OFFLINE'}`));
            }
            catch (error) {
                console.error('Error updating broadcast status:', error);
                socket.emit('chat-error', createErrorResponse('Failed to update broadcast status', 'STATUS_UPDATE_FAILED'));
            }
        });
        socket.on('edit-message', (broadcastId, messageId, newContent) => {
            try {
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('message-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                const message = room.messages.find(msg => msg.id === messageId);
                if (!message) {
                    socket.emit('message-error', createErrorResponse('Message not found', 'MESSAGE_NOT_FOUND'));
                    return;
                }
                if (message.userId !== user.userId && !['host', 'moderator', 'admin'].includes(user.role)) {
                    socket.emit('message-error', createErrorResponse('Not authorized to edit this message', 'PERMISSION_DENIED'));
                    return;
                }
                const validation = validateMessageContent(newContent, room.settings.maxMessageLength);
                if (!validation.valid) {
                    socket.emit('message-error', createErrorResponse(validation.error, 'INVALID_CONTENT'));
                    return;
                }
                message.content = newContent.trim();
                message.isEdited = true;
                io.to(`chat-${broadcastId}`).emit('message-updated', {
                    messageId,
                    updates: {
                        content: message.content,
                        isEdited: true
                    },
                    editedBy: user.username,
                    editedAt: new Date().toISOString()
                });
                socket.emit('message-sent', createSuccessResponse('Message edited successfully'));
                console.log(`✏️ Message edited by ${user.username} in ${broadcastId}: ${messageId}`);
            }
            catch (error) {
                console.error('Error editing message:', error);
                socket.emit('message-error', createErrorResponse('Failed to edit message', 'EDIT_FAILED'));
            }
        });
        socket.on('delete-message', (broadcastId, messageId) => {
            try {
                const room = chatRooms.get(broadcastId);
                const user = room?.users.get(socket.id);
                if (!room || !user) {
                    socket.emit('message-error', createErrorResponse('Room or user not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                const messageIndex = room.messages.findIndex(msg => msg.id === messageId);
                if (messageIndex === -1) {
                    socket.emit('message-error', createErrorResponse('Message not found', 'MESSAGE_NOT_FOUND'));
                    return;
                }
                const message = room.messages[messageIndex];
                if (message.userId !== user.userId && !['host', 'moderator', 'admin'].includes(user.role)) {
                    socket.emit('message-error', createErrorResponse('Not authorized to delete this message', 'PERMISSION_DENIED'));
                    return;
                }
                room.messages.splice(messageIndex, 1);
                io.to(`chat-${broadcastId}`).emit('message-deleted', {
                    messageId,
                    deletedBy: user.username,
                    deletedAt: new Date().toISOString()
                });
                socket.emit('message-sent', createSuccessResponse('Message deleted successfully'));
                console.log(`🗑️ Message deleted by ${user.username} in ${broadcastId}: ${messageId}`);
            }
            catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('message-error', createErrorResponse('Failed to delete message', 'DELETE_FAILED'));
            }
        });
        socket.on('typing-start', (broadcastId, username) => {
            try {
                const room = chatRooms.get(broadcastId);
                if (!room) {
                    socket.emit('chat-error', createErrorResponse('Room not found', 'ROOM_NOT_FOUND'));
                    return;
                }
                const user = room.users.get(socket.id);
                if (!user) {
                    socket.emit('chat-error', createErrorResponse('User not found in room', 'USER_NOT_FOUND'));
                    return;
                }
                if (user.isMuted || user.isBanned) {
                    return; // Silently ignore typing from muted/banned users
                }
                // Clear any existing typing timeout
                if (typingTimeouts.has(socket.id)) {
                    clearTimeout(typingTimeouts.get(socket.id));
                }
                // Only proceed if user is not already typing
                if (!room.typingUsers.has(socket.id)) {
                    const typingInfo = {
                        username: user.username,
                        startTime: new Date()
                    };
                    room.typingUsers.set(socket.id, typingInfo);
                    user.isTyping = true;
                    user.lastActivity = new Date();
                    // Notify other users
                    socket.to(`chat-${broadcastId}`).emit('user-typing', {
                        userId: socket.id,
                        username: user.username,
                        timestamp: new Date().toISOString()
                    });
                }
                // Set/reset auto-stop timeout
                const timeoutId = setTimeout(() => {
                    if (room.typingUsers.has(socket.id)) {
                        room.typingUsers.delete(socket.id);
                        user.isTyping = false;
                        socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                            userId: socket.id,
                            username: user.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                    typingTimeouts.delete(socket.id);
                }, 3000);
                typingTimeouts.set(socket.id, timeoutId);
            }
            catch (error) {
                console.error('Error in typing-start:', error);
                socket.emit('chat-error', createErrorResponse('Failed to start typing indicator', 'TYPING_FAILED'));
            }
        });
        socket.on('typing-stop', (broadcastId, username) => {
            try {
                const room = chatRooms.get(broadcastId);
                if (!room)
                    return;
                const user = room.users.get(socket.id);
                if (!user)
                    return;
                // Clear timeout if exists
                if (typingTimeouts.has(socket.id)) {
                    clearTimeout(typingTimeouts.get(socket.id));
                    typingTimeouts.delete(socket.id);
                }
                // Remove from typing users and notify others
                if (room.typingUsers.has(socket.id)) {
                    room.typingUsers.delete(socket.id);
                    user.isTyping = false;
                    socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                        userId: socket.id,
                        username: user.username,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            catch (error) {
                console.error('Error in typing-stop:', error);
            }
        });
        socket.on('disconnect', async (reason) => {
            try {
                chat_metrics_1.chatMetrics.decrementActiveConnections();
                console.log(`💬 Chat client disconnected: ${socket.id} - ${reason} (Active: ${chat_metrics_1.chatMetrics.getMetrics().activeConnections})`);
                // Clear any typing timeouts
                if (typingTimeouts.has(socket.id)) {
                    clearTimeout(typingTimeouts.get(socket.id));
                    typingTimeouts.delete(socket.id);
                }
                // Remove user from all rooms they were in
                chatRooms.forEach((room, broadcastId) => {
                    const user = room.users.get(socket.id);
                    if (user) {
                        // Clear typing indicator
                        if (room.typingUsers.has(socket.id)) {
                            room.typingUsers.delete(socket.id);
                            socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                                userId: socket.id,
                                username: user.username,
                                timestamp: new Date().toISOString()
                            });
                        }
                        // Remove user from room
                        room.users.delete(socket.id);
                        // Notify others about user leaving
                        socket.to(`chat-${broadcastId}`).emit('user-left', {
                            user: {
                                id: user.id,
                                username: user.username,
                                role: user.role
                            },
                            userCount: room.users.size,
                            timestamp: new Date().toISOString()
                        });
                        // Send updated user list
                        socket.to(`chat-${broadcastId}`).emit('users-updated', {
                            users: Array.from(room.users.values()).map(u => ({
                                id: u.id,
                                username: u.username,
                                role: u.role,
                                avatar: u.avatar,
                                isTyping: u.isTyping
                            })),
                            count: room.users.size
                        });
                        console.log(`👋 User ${user.username} left chat ${broadcastId} (${room.users.size} remaining)`);
                    }
                });
                // Clean up user session
                userSessions.delete(socket.id);
            }
            catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });
    // Periodic cleanup
    setInterval(() => {
        const now = new Date();
        chatRooms.forEach((room, broadcastId) => {
            // Clean up old typing indicators
            room.typingUsers.forEach((typingInfo, socketId) => {
                if (now.getTime() - typingInfo.startTime.getTime() > 10000) {
                    room.typingUsers.delete(socketId);
                    const user = room.users.get(socketId);
                    if (user) {
                        user.isTyping = false;
                        io.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                            userId: socketId,
                            username: typingInfo.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
            // Clean up empty rooms
            if (room.users.size === 0) {
                const roomAge = now.getTime() - room.stats.createdAt.getTime();
                if (roomAge > 30 * 60 * 1000) {
                    console.log(`🧹 Cleaning up empty chat room: ${broadcastId}`);
                    chatRooms.delete(broadcastId);
                    chat_metrics_1.chatMetrics.setRoomCount(chatRooms.size);
                }
            }
        });
        // Clean up orphaned timeouts
        typingTimeouts.forEach((timeoutId, socketId) => {
            let found = false;
            chatRooms.forEach(room => {
                if (room.users.has(socketId)) {
                    found = true;
                }
            });
            if (!found) {
                clearTimeout(timeoutId);
                typingTimeouts.delete(socketId);
            }
        });
    }, 60000);
}
//# sourceMappingURL=chat.js.map