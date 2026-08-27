import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GeographyService } from '../services/geography.service';

export async function nearbyRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().optional().default(50)
    });

    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid lat and lng query params are required', requestId: request.id }
      });
    }

    const places = await GeographyService.getNearbyPlaces(parsed.data.lat, parsed.data.lng, parsed.data.radius);
    return { success: true, data: places };
  });
}
