import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { trainRoutes } from './routes/trains';
import { weatherRoutes } from './routes/weather';
import { nearbyRoutes } from './routes/nearby';
import { sharingRoutes } from './routes/sharing';
import { elevationRoutes } from './routes/elevation';

export function buildServer() {
  const fastify = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id'
  });

  // Plugins
  fastify.register(cors, {
    origin: true
  });

  fastify.register(helmet, {
    contentSecurityPolicy: false // Disabled for dev flexibility
  });

  fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute'
  });

  // Healthcheck endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API v1 routes
  fastify.register(trainRoutes, { prefix: '/api/v1/trains' });
  fastify.register(elevationRoutes, { prefix: '/api/v1/trains' });
  fastify.register(weatherRoutes, { prefix: '/api/v1/weather' });
  fastify.register(nearbyRoutes, { prefix: '/api/v1/nearby' });
  fastify.register(sharingRoutes, { prefix: '/api/v1' });

  return fastify;
}
