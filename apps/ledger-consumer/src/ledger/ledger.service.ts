import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ConsumerIdempotency,
  KAFKA_CLIENT,
  KafkaTopics,
  KafkaConsumerGroups,
  PaymentCreatedEvent,
  LedgerResultEvent,
  DltService,
} from '@app/shared';

@Injectable()
export class LedgerService implements OnModuleInit {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(ConsumerIdempotency)
    private readonly idempotencyRepo: Repository<ConsumerIdempotency>,
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
    private readonly dltService: DltService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaClient.connect();
    this.logger.log('kafka producer ready');
  }

  async processPaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    const { eventId, correlationId, payload } = event;
    const txnId = payload.transactionExternalId;

    try {
      const existing = await this.idempotencyRepo.findOne({
        where: { eventId, consumerGroup: KafkaConsumerGroups.LEDGER },
      });

      if (existing) {
        this.logger.warn(`event ${eventId} already handled by ledger, skip`);
        return;
      }

      // por ahora simula el registro contable
      const ledgerEntryId = uuidv4();
      this.logger.log(`recording ledger entry ${ledgerEntryId} for txn ${txnId}`);

      const resultEvent: LedgerResultEvent = {
        eventId: uuidv4(),
        correlationId,
        eventType: 'payment.ledger-result.v1',
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          transactionExternalId: txnId,
          recorded: true,
          ledgerEntryId,
          reason: null,
        },
      };

      this.kafkaClient.emit(KafkaTopics.PAYMENT_LEDGER_RESULT, resultEvent);

      await this.idempotencyRepo.save(
        this.idempotencyRepo.create({
          eventId,
          consumerGroup: KafkaConsumerGroups.LEDGER,
          status: 'processed',
        }),
      );

      this.logger.log(`ledger entry ${ledgerEntryId} saved for ${txnId}`);
    } catch (error) {
      const exhausted = await this.dltService.handleFailure(
        event,
        KafkaConsumerGroups.LEDGER,
        KafkaTopics.PAYMENT_CREATED,
        error as Error,
      );
      if (!exhausted) throw error;
    }
  }
}
