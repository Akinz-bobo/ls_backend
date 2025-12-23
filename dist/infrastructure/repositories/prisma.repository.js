"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBroadcastRepository = exports.PrismaPodcastRepository = exports.PrismaStaffRepository = exports.PrismaUserRepository = void 0;
class PrismaUserRepository {
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
exports.PrismaUserRepository = PrismaUserRepository;
class PrismaStaffRepository {
    async findById(id) {
        return null;
    }
    async findByUserId(userId) {
        return null;
    }
}
exports.PrismaStaffRepository = PrismaStaffRepository;
class PrismaPodcastRepository {
    async findAll() {
        return [];
    }
    async findById(id) {
        return null;
    }
    async create(podcast) {
        return { ...podcast, id: 'mock', createdAt: new Date() };
    }
}
exports.PrismaPodcastRepository = PrismaPodcastRepository;
class PrismaBroadcastRepository {
    async findAll() {
        return [];
    }
    async findById(id) {
        return null;
    }
    async findLive() {
        return [];
    }
    async create(broadcast) {
        return { ...broadcast, id: 'mock' };
    }
    async update(id, data) {
        return { id, ...data };
    }
}
exports.PrismaBroadcastRepository = PrismaBroadcastRepository;
//# sourceMappingURL=prisma.repository.js.map