export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
}
export interface Staff extends User {
    role: string;
    permissions: string[];
}
export interface Podcast {
    id: string;
    title: string;
    description: string;
    audioUrl: string;
    duration: number;
    createdAt: Date;
}
export interface LiveBroadcast {
    id: string;
    title: string;
    description: string;
    status: 'SCHEDULED' | 'LIVE' | 'ENDED';
    startTime: Date;
    endTime?: Date;
    hostUserId: string;
}
//# sourceMappingURL=index.d.ts.map