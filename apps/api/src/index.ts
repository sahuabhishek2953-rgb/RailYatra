// IMPORTANT: dotenv.config() must run before any other imports
// that read process.env at module load time.
import dotenv from 'dotenv';
dotenv.config();

import { buildServer } from './server';

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

const server = buildServer();

server.listen({ port, host }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 RailYatra API server running at ${address}`);
  console.log(`   RAILRADAR_API_KEY: ${process.env.RAILRADAR_API_KEY ? '✅ loaded' : '❌ MISSING'}`);
  console.log(`   OPENWEATHER_API_KEY: ${process.env.OPENWEATHER_API_KEY ? '✅ loaded' : '❌ MISSING'}`);
});
