import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { WeatherService } from '../services/weather.service';

export async function weatherRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number()
    });

    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid lat and lng query params are required', requestId: request.id }
      });
    }

    const weather = await WeatherService.getWeather(parsed.data.lat, parsed.data.lng);
    return { success: true, data: weather };
  });
}
