import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './app/services/auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
  });

  const authService = app.get(AuthService);
  if (config.get('DEFAULT_ADMIN_ENABLED') === 'true') {
    await authService.createDefaultAdmin();
  }

  const port = config.get<number>('PORT') || 3000;
  console.log('================ APP START DEBUG ================');
  console.log('[APP] PORT:', port);
  console.log('[APP] NODE_ENV:', process.env.NODE_ENV ?? '(not set)');
  console.log('=================================================');
  await app.listen(port);
  console.log(`Server started on port ${port}`);
}

bootstrap();