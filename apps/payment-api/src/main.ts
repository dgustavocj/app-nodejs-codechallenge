import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { KafkaConsumerGroups } from '@app/shared';

async function bootstrap() {
  const logger = new Logger('PaymentAPI');

  const app = await NestFactory.create(AppModule);

  app.use((req: any, res: any, next: any) => {
    const id = req.headers['x-correlation-id'] ?? uuidv4();
    req.headers['x-correlation-id'] = id;
    res.setHeader('x-correlation-id', id);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'payment-api-consumer',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      },
      consumer: {
        groupId: KafkaConsumerGroups.STATUS_SAGA,
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PAYMENT_API_PORT ?? 3000;
  await app.listen(port);

  logger.log(`listening on port ${port}`);
  logger.log('kafka consumer connected for status saga');
}

bootstrap();
