import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadLetterEventRecord } from '../entities/dead-letter-event.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { DltService } from './dlt.service';

@Module({})
export class DltModule {
  static register(kafkaClientId: string): DynamicModule {
    return {
      module: DltModule,
      imports: [
        TypeOrmModule.forFeature([DeadLetterEventRecord]),
        KafkaModule.forProducer(kafkaClientId),
      ],
      providers: [DltService],
      exports: [DltService],
    };
  }
}
