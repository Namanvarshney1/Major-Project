import { app } from './app.js';
import { config } from './config.js';
import { connectToDatabase, closeDatabaseConnection } from './db/mongodb.js';

export async function startServer() {
  await connectToDatabase();
  const server = app.listen(config.port, () => {
    console.log(`========================================================`);
    console.log(` PrepPulse Node.js Backend Server Active on Port ${config.port}`);
    console.log(` Target Database: ${config.mongodbDatabase}`);
    console.log(` Python AI Microservice: ${config.pythonAiServiceUrl}`);
    console.log(` Environment: ${config.environment}`);
    console.log(`========================================================`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down PrepPulse Node.js Backend...');
    server.close(async () => {
      await closeDatabaseConnection();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

startServer().catch(err => {
  console.error('Fatal error starting PrepPulse backend:', err);
  process.exit(1);
});

