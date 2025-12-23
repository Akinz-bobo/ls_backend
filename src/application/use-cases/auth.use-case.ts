import { IUserRepository, IStaffRepository } from '../../domain/repositories';
import { IAuthService, IPasswordService } from '../interfaces';
import { LoginRequestDTO, LoginResponseDTO, RegisterRequestDTO } from '../dto';
import { User } from '../../domain/entities';

export class AuthUseCase {
  constructor(
    private userRepository: IUserRepository,
    private staffRepository: IStaffRepository,
    private authService: IAuthService,
    private passwordService: IPasswordService
  ) {}

  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    const { email, password } = credentials;

    // Check staff first
    let staffUser = await this.staffRepository.findByEmail(email);
    let regularUser = null;

    if (!staffUser) {
      regularUser = await this.userRepository.findByEmail(email);
    }

    const user = staffUser || regularUser;
    const isStaff = !!staffUser;

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordValid = await this.passwordService.compare(password, user.password);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email');
    }

    if (isStaff && staffUser && !staffUser.isApproved) {
      throw new Error('Your account is pending approval');
    }

    const token = await this.authService.generateToken({
      userId: user.id,
      role: isStaff ? staffUser!.role : 'USER'
    });

    let userData;
    if (isStaff && staffUser) {
      userData = {
        id: staffUser.id,
        email: staffUser.email,
        name: `${staffUser.firstName} ${staffUser.lastName}`,
        role: staffUser.role,
        isApproved: staffUser.isApproved || false,
      };
    } else if (regularUser) {
      userData = {
        id: regularUser.id,
        email: regularUser.email,
        name: regularUser.name,
        role: 'USER',
        isApproved: true,
      };
    }

    return { token, user: userData! };
  }

  async register(userData: RegisterRequestDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.passwordService.hash(userData.password);
    
    return this.userRepository.create({
      ...userData,
      password: hashedPassword,
      emailVerified: false
    });
  }
}