import { DataSource } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { ConsumerIdempotency } from '../entities/consumer-idempotency.entity';
import { DeadLetterEventRecord } from '../entities/dead-letter-event.entity';

// Para CLI de TypeORM (migraciones)
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'payments',
  entities: [Payment, OutboxEvent, ConsumerIdempotency, DeadLetterEventRecord],
  migrations: ['libs/shared/src/database/migrations/*.ts'],
});
