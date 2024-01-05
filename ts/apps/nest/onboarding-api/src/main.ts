import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import AppModule from './app/app.module';
import { setupApiDocumentation } from './app/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  setupApiDocumentation(app);
  await app.listen(config.get<string>('PORT') || 8080);
}
bootstrap();
