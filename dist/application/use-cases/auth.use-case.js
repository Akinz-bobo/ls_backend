"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
class AuthUseCase {
    constructor(userRepository, staffRepository, authService, passwordService) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
        this.authService = authService;
        this.passwordService = passwordService;
    }
    async login(credentials) {
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
            role: isStaff ? staffUser.role : 'USER'
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
        }
        else if (regularUser) {
            userData = {
                id: regularUser.id,
                email: regularUser.email,
                name: regularUser.name,
                role: 'USER',
                isApproved: true,
            };
        }
        return { token, user: userData };
    }
    async register(userData) {
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
exports.AuthUseCase = AuthUseCase;
//# sourceMappingURL=auth.use-case.js.map