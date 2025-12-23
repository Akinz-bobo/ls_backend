"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodcastUseCase = void 0;
class PodcastUseCase {
    constructor(podcastRepository) {
        this.podcastRepository = podcastRepository;
    }
    async getAllPodcasts(filters) {
        const podcasts = await this.podcastRepository.findAll(filters);
        // Transform to DTOs
        const podcastDTOs = podcasts.map(podcast => ({
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
    async getPodcastById(id) {
        const podcast = await this.podcastRepository.findById(id);
        if (!podcast)
            return null;
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
    async createPodcast(podcastData) {
        return this.podcastRepository.create(podcastData);
    }
}
exports.PodcastUseCase = PodcastUseCase;
//# sourceMappingURL=podcast.use-case.js.map