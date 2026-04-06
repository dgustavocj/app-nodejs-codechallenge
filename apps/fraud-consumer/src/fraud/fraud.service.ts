import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConsumerIdempotency } from '@app/shared/entities';
import { KAFKA_CLIENT } from '@app/shared/kafka';
import { DltService } from '@app/shared/dlt';
import { KafkaTopics, KafkaConsumerGroups } from '@app/shared/constants';
import {
  PaymentCreatedEvent,
  FraudResultEvent,
} from '@app/shared/contracts';

@Injectable()
export class FraudService implements OnModuleInit {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    @InjectRepository(ConsumerIdempotency)
    private readonly idempotencyRepo: Repository<ConsumerIdempotency>,
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
    private readonly dltService: DltService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async processPaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    const { eventId, correlationId, payload } = event;

    try {
      // skip si ya lo procesamos
      const alreadyProcessed = await this.idempotencyRepo.findOne({
        where: { eventId, consumerGroup: KafkaConsumerGroups.FRAUD },
      });
      if (alreadyProcessed) {
        this.logger.warn(`duplicate event ${eventId}, skipping`);
        return;
      }

      const maxAmount = Number(process.env.FRAUD_MAX_AMOUNT ?? 1000);
      const approved = payload.value <= maxAmount;
      const reason = approved
        ? null
        : `amount ${payload.value} exceeds threshold ${maxAmount}`;

      const fraudResult: FraudResultEvent = {
        eventId: uuidv4(),
        correlationId,
        eventType: KafkaTopics.PAYMENT_FRAUD_RESULT,
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          transactionExternalId: payload.transactionExternalId,
          approved,
          reason,
        },
      };

      this.kafkaClient.emit(KafkaTopics.PAYMENT_FRAUD_RESULT, fraudResult);

      await this.idempotencyRepo.save(
        this.idempotencyRepo.create({
          eventId,
          consumerGroup: KafkaConsumerGroups.FRAUD,
          status: 'processed',
        }),
      );

      this.logger.log(
        `fraud check ${approved ? 'OK' : 'REJECTED'} | txn=${payload.transactionExternalId} value=${payload.value}`,
      );
    } catch (error) {
      const exhausted = await this.dltService.handleFailure(
        event,
        KafkaConsumerGroups.FRAUD,
        KafkaTopics.PAYMENT_CREATED,
        error as Error,
      );
      if (!exhausted) throw error;
    }
  }
}
