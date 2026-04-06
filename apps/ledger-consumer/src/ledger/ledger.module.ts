import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerIdempotency, DltModule, KafkaModule } from '@app/shared';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumerIdempotency]),
    KafkaModule.forProducer('ledger-consumer'),
    DltModule.register('ledger-consumer'),
  ],
  providers: [LedgerService],
  controllers: [LedgerController],
})
export class LedgerModule {}
