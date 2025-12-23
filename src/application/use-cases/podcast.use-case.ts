import { IPodcastRepository } from '../../domain/repositories';
import { PodcastResponseDTO } from '../dto';
import { Podcast } from '../../domain/entities';

export class PodcastUseCase {
  constructor(private podcastRepository: IPodcastRepository) {}

  async getAllPodcasts(filters?: { featured?: boolean; limit?: number }): Promise<{
    podcasts: PodcastResponseDTO[];
    count: number;
  }> {
    const podcasts = await this.podcastRepository.findAll(filters);
    
    // Transform to DTOs
    const podcastDTOs: PodcastResponseDTO[] = podcasts.map(podcast => ({
      id: podcast.id,
      title: podcast.title,
      slug: podcast.slug,
      description: podcast.description,
      category: podcast.category,
      image: podcast.image,
      host: {
        name: podcast.host
      },
      stats: {
        episodes: 0, // TODO: Get from episodes count
        favorites: 0 // TODO: Get from favorites count
      },
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt
    }));

    return {
      podcasts: podcastDTOs,
      count: podcastDTOs.length
    };
  }

  async getPodcastById(id: string): Promise<PodcastResponseDTO | null> {
    const podcast = await this.podcastRepository.findById(id);
    if (!podcast) return null;

    return {
      id: podcast.id,
      title: podcast.title,
      slug: podcast.slug,
      description: podcast.description,
      category: podcast.category,
      image: podcast.image,
      host: {
        name: podcast.host
      },
      stats: {
        episodes: 0,
        favorites: 0
      },
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt
    };
  }

  async createPodcast(podcastData: Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<Podcast> {
    return this.podcastRepository.create(podcastData);
  }
}