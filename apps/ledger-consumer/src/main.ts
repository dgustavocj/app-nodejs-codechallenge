import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { KafkaConsumerGroups } from '@app/shared/constants';

async function bootstrap() {
  const logger = new Logger('LedgerConsumer');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'ledger-consumer',
          brokers: (
            process.env.KAFKA_BROKERS ?? 'localhost:9092'
          ).split(','),
        },
        consumer: {
          groupId: KafkaConsumerGroups.LEDGER,
        },
      },
    },
  );

  await app.listen();
  logger.log('ledger consumer up');
}

bootstrap();
