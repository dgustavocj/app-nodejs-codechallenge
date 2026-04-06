import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent, KafkaModule } from '@app/shared';
import { RelayService } from './relay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    KafkaModule.forProducer('outbox-relay'),
  ],
  providers: [RelayService],
  exports: [RelayService],
})
export class RelayModule {}
