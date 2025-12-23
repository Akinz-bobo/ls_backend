import { IUserRepository, IStaffRepository } from '../../domain/repositories';
import { IAuthService, IPasswordService } from '../interfaces';
import { LoginRequestDTO, LoginResponseDTO, RegisterRequestDTO } from '../dto';
import { User } from '../../domain/entities';
export declare class AuthUseCase {
    private userRepository;
    private staffRepository;
    private authService;
    private passwordService;
    constructor(userRepository: IUserRepository, staffRepository: IStaffRepository, authService: IAuthService, passwordService: IPasswordService);
    login(credentials: LoginRequestDTO): Promise<LoginResponseDTO>;
    register(userData: RegisterRequestDTO): Promise<User>;
}
//# sourceMappingURL=auth.use-case.d.ts.map