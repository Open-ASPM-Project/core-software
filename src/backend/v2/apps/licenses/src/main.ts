import { bootstrapCore } from '@firewall-backend/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapCore(AppModule, {
    port: 4000,
    swagger: {
      title: 'Licensing Service',
      description: 'Licensing server for maintaining licensing',
      version: '1.0',
      enableBearerAuth: true,
      path: 'swagger',
    },
  });
}

bootstrap();
