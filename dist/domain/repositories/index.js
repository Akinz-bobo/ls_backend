"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
class UserRepository {
    async findById(id) {
        return null;
    }
    async findByEmail(email) {
        return null;
    }
    async create(user) {
        return { ...user, id: 'mock', createdAt: new Date() };
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=index.js.map