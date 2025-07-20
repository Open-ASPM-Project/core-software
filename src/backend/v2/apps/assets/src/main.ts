import { AppModule } from './app/app.module';
import { bootstrapCore } from '@firewall-backend/core';

async function bootstrap() {
  await bootstrapCore(AppModule, {
    port: parseInt(process.env.PORT) || 4000,
    globalPrefix: 'assets',
    swagger: {
      title: 'Assets Service',
      description: 'Provides APIs for Sources & Assets.',
      version: '1.0',
      enableBearerAuth: true,
      path: 'swagger', // final path => /swagger
    },
  });
}

bootstrap();
