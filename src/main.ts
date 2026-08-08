import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => {
      const message = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .join('; ');
      return new BadRequestException(message);
    }
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
