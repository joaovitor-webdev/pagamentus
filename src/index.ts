export { app, startServer } from './server';

import { startServer } from './server';

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  });
}
