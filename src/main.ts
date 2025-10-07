// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 5000);
// }
// void bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const originsURL = process.env.FRONTEND_URL || process.env.DEV_URL;
  const port = process.env.BACKEND_PORT || 5000;

  app.enableCors({
    origin: originsURL,
    // credentials: true,
  });

  app.setGlobalPrefix('api');

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Server is running on port ${port}`);
  // console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Error starting server', err);
  process.exit(1);
});
