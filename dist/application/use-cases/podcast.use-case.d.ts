import { IPodcastRepository } from '../../domain/repositories';
import { PodcastResponseDTO } from '../dto';
import { Podcast } from '../../domain/entities';
export declare class PodcastUseCase {
    private podcastRepository;
    constructor(podcastRepository: IPodcastRepository);
    getAllPodcasts(filters?: {
        featured?: boolean;
        limit?: number;
    }): Promise<{
        podcasts: PodcastResponseDTO[];
        count: number;
    }>;
    getPodcastById(id: string): Promise<PodcastResponseDTO | null>;
    createPodcast(podcastData: Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<Podcast>;
}
//# sourceMappingURL=podcast.use-case.d.ts.map