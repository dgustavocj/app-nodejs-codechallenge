import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerIdempotency } from '@app/shared/entities';
import { KafkaModule } from '@app/shared/kafka';
import { DltModule } from '@app/shared/dlt';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumerIdempotency]),
    KafkaModule.forProducer('fraud-consumer'),
    DltModule.register('fraud-consumer'),
  ],
  controllers: [FraudController],
  providers: [FraudService],
})
export class FraudModule {}
