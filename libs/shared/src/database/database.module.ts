import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { ConsumerIdempotency } from '../entities/consumer-idempotency.entity';
import { DeadLetterEventRecord } from '../entities/dead-letter-event.entity';
import { PaymentStatusTracking } from '../entities/payment-status-tracking.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'payments'),
        entities: [Payment, OutboxEvent, ConsumerIdempotency, DeadLetterEventRecord, PaymentStatusTracking],
        synchronize: true, // usar migrations en prod
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
