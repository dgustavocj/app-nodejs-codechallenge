import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Payment,
  OutboxEvent,
  PaymentStatus,
  KafkaTopics,
  CreatePaymentDto,
  PaymentCreatedEvent,
} from '@app/shared';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly dataSource: DataSource,
  ) {}

  async createPayment(dto: CreatePaymentDto, correlationId: string): Promise<Payment> {
    const transactionExternalId = uuidv4();
    const eventId = uuidv4();

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const payment = qr.manager.create(Payment, {
        transactionExternalId,
        accountExternalIdDebit: dto.accountExternalIdDebit,
        accountExternalIdCredit: dto.accountExternalIdCredit,
        transferTypeId: dto.transferTypeId,
        value: dto.value,
        status: PaymentStatus.PENDING,
      });
      const saved = await qr.manager.save(Payment, payment);

      const domainEvent: PaymentCreatedEvent = {
        eventId,
        correlationId,
        eventType: 'payment.created.v1',
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          transactionExternalId,
          accountExternalIdDebit: dto.accountExternalIdDebit,
          accountExternalIdCredit: dto.accountExternalIdCredit,
          transferTypeId: dto.transferTypeId,
          value: dto.value,
        },
      };

      const outbox = qr.manager.create(OutboxEvent, {
        eventId,
        correlationId,
        eventType: 'payment.created.v1',
        topic: KafkaTopics.PAYMENT_CREATED,
        payload: domainEvent as Record<string, any>,
        published: false,
      });
      await qr.manager.save(OutboxEvent, outbox);

      await qr.commitTransaction();
      this.logger.log(`payment created ${transactionExternalId} | event=${eventId}`);

      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      this.logger.error('failed to create payment', (err as Error).stack);
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findPayment(transactionExternalId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { transactionExternalId },
    });

    if (!payment) {
      throw new NotFoundException(`payment ${transactionExternalId} not found`);
    }

    return payment;
  }
}
