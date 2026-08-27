import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { JourneyService } from '../services/journey.service';
import { ElevationService } from '../services/elevation.service';

export async function elevationRoutes(fastify: FastifyInstance) {
  fastify.get('/:id/elevation', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid train ID', requestId: request.id }
      });
    }

    try {
      // Get train detail to extract route coordinates
      const detail = await JourneyService['fetchTrainDetail'](params.data.id);
      const coords: [number, number][] = detail.route
        .filter(s => s.station.lat && s.station.lng)
        .map(s => [s.station.lng, s.station.lat]);

      if (coords.length < 2) {
        return reply.status(200).send({ success: true, data: [] });
      }

      const profile = await ElevationService.getElevationProfile(coords, params.data.id);
      return { success: true, data: profile };
    } catch (err: any) {
      fastify.log.error(err, 'Elevation fetch failed');
      return reply.status(502).send({
        success: false,
        error: { code: 'ELEVATION_UNAVAILABLE', message: 'Elevation data temporarily unavailable', requestId: request.id }
      });
    }
  });
}
