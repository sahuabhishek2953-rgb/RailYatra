import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SharingService } from '../services/sharing.service';

export async function sharingRoutes(fastify: FastifyInstance) {
  // Create share token
  fastify.post('/share', async (request, reply) => {
    const schema = z.object({
      trainId: z.string()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'trainId string required', requestId: request.id }
      });
    }

    try {
      const token = await SharingService.createShareToken(parsed.data.trainId);
      return { success: true, data: { token, shareUrl: `/share/${token}` } };
    } catch (e: any) {
      return reply.status(404).send({
        success: false,
        error: { code: 'SHARE_FAILED', message: e.message || 'Share link generation failed', requestId: request.id }
      });
    }
  });

  // Resolve public share token
  fastify.get('/shared/:token', async (request, reply) => {
    const schema = z.object({ token: z.string() });
    const parsed = schema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Valid share token required', requestId: request.id }
      });
    }

    const snapshot = await SharingService.getSharedJourney(parsed.data.token);
    if (!snapshot) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EXPIRED_OR_INVALID', message: 'Shared journey not found or link has expired', requestId: request.id }
      });
    }

    return { success: true, data: snapshot };
  });
}
