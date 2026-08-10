import app from './app';
import { config } from './config/env';

const PORT = config.port;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`=========================================`);
  console.log(`🚀 NexaERP Server running on ${HOST}:${PORT}`);
  console.log(`🩺 Health check: /api/health`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`=========================================`);
});
