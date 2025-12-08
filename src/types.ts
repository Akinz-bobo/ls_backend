export interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  messageType: 'user' | 'host' | 'moderator' | 'system' | 'announcement'
  role: 'listener' | 'host' | 'moderator' | 'admin'
  avatar?: string
  timestamp: Date
  socketId: string
  likes: number
  likedBy: string[]
  reactions: { [emoji: string]: string[] }
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  replyTo?: string
  lastMessageTime?: number
}

export interface ChatUser {
  id: string
  userId: string
  username: string
  role: 'listener' | 'host' | 'moderator' | 'admin'
  avatar?: string
  joinedAt: Date
  lastActivity: Date
  messageCount: number
  isTyping: boolean
  isMuted: boolean
  isBanned: boolean
  lastMessageTime?: number
}

export interface TypingInfo {
  username: string
  startTime: Date
}

export interface ChatSettings {
  slowMode: number // seconds
  maxMessageLength: number
  allowEmojis: boolean
  moderationEnabled: boolean
}

export interface ChatStats {
  totalMessages: number
  totalUsers: number
  createdAt: Date
}

export interface ChatRoom {
  messages: ChatMessage[]
  users: Map<string, ChatUser>
  typingUsers: Map<string, TypingInfo>
  settings: ChatSettings
  stats: ChatStats
}

export interface ModerationAction {
  action: 'ban' | 'unban' | 'mute' | 'unmute' | 'timeout'
  userId: string
  moderatorId: string
  reason?: string
  duration?: number // in minutes for timeout
  timestamp: Date
}

export interface SocketEventData {
  broadcastId: string
  userId?: string
  username?: string
  messageId?: string
  content?: string
  messageType?: string
  timestamp?: string
  [key: string]: any
}

export interface ConnectionMetrics {
  totalConnections: number
  activeConnections: number
  messagesPerSecond: number
  roomCount: number
}

export interface ErrorResponse {
  error: string
  code?: string
  timestamp: string
}

export interface SuccessResponse {
  success: boolean
  message?: string
  data?: any
  timestamp: string
}

// Audio and broadcast types
export interface BroadcastSession {
  id: string
  broadcastId: string
  broadcasterId: string
  broadcaster?: string
  title: string
  startTime: Date
  endTime?: Date
  isLive: boolean
  audioSources: Map<string, AudioSourceInfo>
  listeners: Map<string, ConnectionInfo>
  activeCall?: ActiveCall
  activeCalls: Map<string, ActiveCall>
  callQueue: CallRequest[]
  maxListeners?: number
  broadcasterInfo?: BroadcasterInfo
  stats: {
    startTime: Date
    peakListeners: number
    totalCalls: number
    totalMessages: number
  }
}

export interface ConnectionInfo {
  socketId: string
  userId?: string
  username?: string
  broadcastId?: string | null
  role?: 'listener' | 'broadcaster' | 'guest'
  joinTime?: Date
  connectionTime?: Date
  lastActivity: Date
  connectionType?: 'listener' | 'broadcaster' | 'guest'
  audioEnabled?: boolean
  isConnected?: boolean
}

export interface AudioSourceInfo {
  id: string
  sourceId?: string
  type: 'microphone' | 'call' | 'caller' | 'file' | 'stream'
  name?: string
  isActive: boolean
  volume: number
  isMuted: boolean
  addedAt: Date
  priority?: number
  socketId?: string
  metadata?: any
}

export interface CallRequest {
  callId: string
  callerId: string
  fromUserId?: string
  toUserId?: string
  callerName: string
  callerLocation?: string
  broadcastId?: string
  status: 'pending' | 'accepted' | 'rejected' | 'ended'
  requestTime: Date
  createdAt?: Date
  acceptedAt?: Date
  endedAt?: Date
}

export interface ActiveCall {
  callId: string
  callerId?: string
  callerName?: string
  participants?: string[]
  broadcastId?: string
  startTime?: Date
  acceptTime?: Date
  endTime?: Date
  status?: 'pending' | 'accepted' | 'rejected' | 'ended'
  socketId?: string
  isRecording?: boolean
}

export interface BroadcasterInfo {
  userId?: string
  username: string
  stationName?: string
  socketId?: string
  broadcastId?: string
  isLive?: boolean
  startTime?: Date
  listenerCount?: number
  audioSources?: AudioSourceInfo[]
}