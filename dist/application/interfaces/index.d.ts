export interface IAuthService {
    login(email: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
    register(userData: any): Promise<{
        token: string;
        user: any;
    }>;
}
export interface IPasswordService {
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
}
//# sourceMappingURL=index.d.ts.map