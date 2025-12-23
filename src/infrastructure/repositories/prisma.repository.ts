import { PrismaClient } from '@prisma/client';
import { IUserRepository, IStaffRepository, IPodcastRepository, IBroadcastRepository } from '../../domain/repositories';
import { User, Staff, Podcast, LiveBroadcast } from '../../domain/entities';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.prisma.user.create({ data: userData });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: userData });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}

export class PrismaStaffRepository implements IStaffRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<Staff | null> {
    return this.prisma.staff.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<Staff | null> {
    return this.prisma.staff.findUnique({ where: { id } });
  }

  async create(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
    return this.prisma.staff.create({ data: staffData });
  }

  async update(id: string, staffData: Partial<Staff>): Promise<Staff> {
    return this.prisma.staff.update({ where: { id }, data: staffData });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.staff.delete({ where: { id } });
  }
}

export class PrismaPodcastRepository implements IPodcastRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: { featured?: boolean; limit?: number }): Promise<Podcast[]> {
    return this.prisma.podcast.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: filters?.featured 
        ? [{ favorites: { _count: 'desc' } }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
      take: filters?.limit || 10
    });
  }

  async findById(id: string): Promise<Podcast | null> {
    return this.prisma.podcast.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Podcast | null> {
    return this.prisma.podcast.findUnique({ where: { slug } });
  }

  async create(podcastData: Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<Podcast> {
    return this.prisma.podcast.create({ data: podcastData });
  }

  async update(id: string, podcastData: Partial<Podcast>): Promise<Podcast> {
    return this.prisma.podcast.update({ where: { id }, data: podcastData });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.podcast.delete({ where: { id } });
  }
}

export class PrismaBroadcastRepository implements IBroadcastRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<LiveBroadcast | null> {
    return this.prisma.liveBroadcast.findUnique({ where: { id } });
  }

  async findLive(): Promise<LiveBroadcast[]> {
    return this.prisma.liveBroadcast.findMany({
      where: { status: 'LIVE' }
    });
  }

  async create(broadcastData: Omit<LiveBroadcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveBroadcast> {
    return this.prisma.liveBroadcast.create({ data: broadcastData });
  }

  async update(id: string, broadcastData: Partial<LiveBroadcast>): Promise<LiveBroadcast> {
    return this.prisma.liveBroadcast.update({ where: { id }, data: broadcastData });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.liveBroadcast.delete({ where: { id } });
  }
}