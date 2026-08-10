import app from './app';
import { config } from './config/env';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 NexaERP Server running on port ${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`=========================================`);
});
