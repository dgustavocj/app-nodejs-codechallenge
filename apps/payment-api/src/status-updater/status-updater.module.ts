import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, ConsumerIdempotency, PaymentStatusTracking, KafkaModule } from '@app/shared';
import { StatusSagaController } from './status-saga.controller';
import { StatusSagaService } from './status-saga.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, ConsumerIdempotency, PaymentStatusTracking]),
    KafkaModule.forProducer('status-saga'),
  ],
  providers: [StatusSagaService],
  controllers: [StatusSagaController],
})
export class StatusUpdaterModule {}
