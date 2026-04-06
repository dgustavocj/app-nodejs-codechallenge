import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Payment,
  ConsumerIdempotency,
  PaymentStatusTracking,
  PaymentStatus,
  KafkaTopics,
  KafkaConsumerGroups,
  KAFKA_CLIENT,
  FraudResultEvent,
  LedgerResultEvent,
  PaymentSettledEvent,
} from '@app/shared';

@Injectable()
export class StatusSagaService {
  private readonly logger = new Logger(StatusSagaService.name);
  private readonly group = KafkaConsumerGroups.STATUS_SAGA;

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly dataSource: DataSource,
  ) {}

  async handleFraudResult(event: FraudResultEvent): Promise<void> {
    const { eventId, payload } = event;
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (await this.alreadyProcessed(qr, eventId)) {
        await qr.rollbackTransaction();
        return;
      }

      const tracking = await this.getOrCreateTracking(qr, payload.transactionExternalId);
      tracking.results = {
        ...tracking.results,
        fraud: { approved: payload.approved, reason: payload.reason ?? undefined },
      };
      await qr.manager.save(PaymentStatusTracking, tracking);
      await this.markProcessed(qr, eventId);

      // rechazo de fraude corta el flujo directo
      if (!payload.approved) {
        await qr.manager.update(
          Payment,
          { transactionExternalId: payload.transactionExternalId },
          { status: PaymentStatus.REJECTED },
        );
        await qr.commitTransaction();
        this.logger.log(`payment ${payload.transactionExternalId} REJECTED (fraud: ${payload.reason})`);
        return;
      }

      // si ledger ya respondio, resolvemos
      if (tracking.results.ledger) {
        await this.resolveSaga(qr, tracking);
      }

      await qr.commitTransaction();
      this.logger.log(`fraud result saved for ${payload.transactionExternalId} approved=${payload.approved}`);
    } catch (error) {
      await qr.rollbackTransaction();
      this.logger.error(`error handling fraud result ${eventId}`, (error as Error).stack);
      throw error;
    } finally {
      await qr.release();
    }
  }

  async handleLedgerResult(event: LedgerResultEvent): Promise<void> {
    const { eventId, payload } = event;
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (await this.alreadyProcessed(qr, eventId)) {
        await qr.rollbackTransaction();
        return;
      }

      const tracking = await this.getOrCreateTracking(qr, payload.transactionExternalId);
      tracking.results = {
        ...tracking.results,
        ledger: { recorded: payload.recorded, reason: payload.reason ?? undefined },
      };
      await qr.manager.save(PaymentStatusTracking, tracking);
      await this.markProcessed(qr, eventId);

      if (tracking.results.fraud) {
        if (!tracking.results.fraud.approved) {
          // fraud ya rechazo, no hay nada mas que hacer
          await qr.commitTransaction();
          return;
        }
        await this.resolveSaga(qr, tracking);
      }

      await qr.commitTransaction();
      this.logger.log(`ledger result for ${payload.transactionExternalId} recorded=${payload.recorded}`);
    } catch (err) {
      await qr.rollbackTransaction();
      this.logger.error(`error on ledger result ${eventId}: ${err}`);
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async resolveSaga(qr: QueryRunner, tracking: PaymentStatusTracking) {
    const { fraud, ledger } = tracking.results;

    let status: PaymentStatus;
    if (fraud?.approved && ledger?.recorded) {
      status = PaymentStatus.SETTLED;
    } else if (!fraud?.approved) {
      status = PaymentStatus.REJECTED;
    } else {
      status = PaymentStatus.FAILED;
    }

    await qr.manager.update(
      Payment,
      { transactionExternalId: tracking.transactionExternalId },
      { status },
    );

    this.logger.log(`saga resolved: ${tracking.transactionExternalId} -> ${status}`);

    const settledEvent: PaymentSettledEvent = {
      eventId: uuidv4(),
      correlationId: tracking.transactionExternalId,
      eventType: 'PaymentSettled',
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        transactionExternalId: tracking.transactionExternalId,
        fraudApproved: fraud?.approved ?? false,
        ledgerRecorded: ledger?.recorded ?? false,
        ledgerEntryId: null,
      },
    };

    const topic = status === PaymentStatus.SETTLED
      ? KafkaTopics.PAYMENT_SETTLED
      : KafkaTopics.PAYMENT_FAILED;

    this.kafkaClient.emit(topic, {
      key: tracking.transactionExternalId,
      value: JSON.stringify(settledEvent),
    });
  }

  private async alreadyProcessed(qr: QueryRunner, eventId: string): Promise<boolean> {
    const existing = await qr.manager.findOne(ConsumerIdempotency, {
      where: { eventId, consumerGroup: this.group },
    });
    if (existing) {
      this.logger.log(`event ${eventId} already processed, skipping`);
    }
    return !!existing;
  }

  private async markProcessed(qr: QueryRunner, eventId: string) {
    await qr.manager.save(
      ConsumerIdempotency,
      qr.manager.create(ConsumerIdempotency, {
        eventId,
        consumerGroup: this.group,
        status: 'processed',
      }),
    );
  }

  private async getOrCreateTracking(qr: QueryRunner, txnId: string): Promise<PaymentStatusTracking> {
    const existing = await qr.manager.findOne(PaymentStatusTracking, {
      where: { transactionExternalId: txnId },
    });
    return existing ?? qr.manager.create(PaymentStatusTracking, {
      transactionExternalId: txnId,
      results: {},
    });
  }
}
