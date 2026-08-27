import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TrainService, JourneyService } from '../services/journey.service';

export async function trainRoutes(fastify: FastifyInstance) {
  // Search trains
  fastify.get('/search', async (request, reply) => {
    const schema = z.object({ q: z.string().min(1) });
    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_QUERY', message: 'Query param "q" is required (min 1 char)', requestId: request.id }
      });
    }

    try {
      const trains = await TrainService.searchTrains(parsed.data.q);
      return { success: true, data: trains };
    } catch (err: any) {
      fastify.log.error(err, 'Train search failed');
      return reply.status(502).send({
        success: false,
        error: { code: 'PROVIDER_ERROR', message: 'Train search temporarily unavailable', requestId: request.id }
      });
    }
  });

  // Get train metadata
  fastify.get('/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid train ID', requestId: request.id } });

    try {
      const result = await JourneyService.getLiveStatus(params.data.id);
      if (!result) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: `Train ${params.data.id} not found`, requestId: request.id } });
      return { success: true, data: result.train };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(502).send({ success: false, error: { code: 'PROVIDER_ERROR', message: 'Train data unavailable', requestId: request.id } });
    }
  });

  // Get live status
  fastify.get('/:id/status', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid train ID', requestId: request.id } });

    try {
      const result = await JourneyService.getLiveStatus(params.data.id);
      if (!result) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Live status unavailable for this train', requestId: request.id } });
      return { success: true, data: result.status };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(502).send({ success: false, error: { code: 'PROVIDER_ERROR', message: 'Live status temporarily unavailable', requestId: request.id } });
    }
  });

  // Get route GeoJSON
  fastify.get('/:id/route', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid train ID', requestId: request.id } });

    try {
      const liveResult = await JourneyService.getLiveStatus(params.data.id);
      if (!liveResult) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Train not found', requestId: request.id } });
      const route = await JourneyService.getRoute(params.data.id, liveResult.train);
      return { success: true, data: route };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(502).send({ success: false, error: { code: 'PROVIDER_ERROR', message: 'Route data unavailable', requestId: request.id } });
    }
  });

  // Get full journey details
  fastify.get('/:id/journey', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid train ID', requestId: request.id } });

    try {
      const journey = await JourneyService.getJourneyDetails(params.data.id);
      if (!journey) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: `No journey data available for train ${params.data.id}`, requestId: request.id } });
      return { success: true, data: journey };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(502).send({ success: false, error: { code: 'PROVIDER_ERROR', message: 'Journey data temporarily unavailable. Please try again.', requestId: request.id } });
    }
  });
}
