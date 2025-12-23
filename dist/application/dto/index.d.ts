export interface LoginRequestDTO {
    email: string;
    password: string;
}
export interface LoginResponseDTO {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}
export interface RegisterRequestDTO {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface BroadcastStreamDTO {
    id: string;
    title: string;
    status: string;
    streamUrl?: string;
}
export interface PodcastResponseDTO {
    id: string;
    title: string;
    description: string;
    audioUrl: string;
    duration: number;
}
//# sourceMappingURL=index.d.ts.map