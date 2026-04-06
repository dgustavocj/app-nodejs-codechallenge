import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DeadLetterEventRecord } from '../entities/dead-letter-event.entity';
import { KAFKA_CLIENT } from '../kafka/kafka.module';
import { KafkaTopics, DLT_MAX_RETRIES } from '../constants/kafka-topics';
import { DomainEvent, DeadLetterEvent } from '../contracts/events';

@Injectable()
export class DltService {
  private readonly logger = new Logger(DltService.name);

  // retry counts en memoria -- se pierden si el proceso muere
  private readonly retryCounts = new Map<string, number>();

  constructor(
    @InjectRepository(DeadLetterEventRecord)
    private readonly dltRepo: Repository<DeadLetterEventRecord>,
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  /**
   * @returns true si se agotaron reintentos (ya no relanzar), false si quedan
   */
  async handleFailure(
    event: DomainEvent,
    consumerGroup: string,
    originalTopic: string,
    error: Error,
  ): Promise<boolean> {
    const key = `${event.eventId}:${consumerGroup}`;
    const attempt = (this.retryCounts.get(key) ?? 0) + 1;
    this.retryCounts.set(key, attempt);

    this.logger.warn(
      `retry ${attempt}/${DLT_MAX_RETRIES} for ${event.eventId} in ${consumerGroup}: ${error.message}`,
    );

    if (attempt < DLT_MAX_RETRIES) {
      return false;
    }

    this.logger.error(`retries exhausted for ${event.eventId}, sending to DLT`);

    const dltEvent: DeadLetterEvent = {
      eventId: uuidv4(),
      correlationId: event.correlationId,
      eventType: 'payment.failed',
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        originalTopic,
        originalEvent: event,
        failureReason: error.message,
        retriesExhausted: DLT_MAX_RETRIES,
      },
    };

    this.kafkaClient.emit(KafkaTopics.PAYMENT_FAILED, dltEvent);

    await this.dltRepo.save(
      this.dltRepo.create({
        eventId: event.eventId,
        originalTopic,
        originalPayload: event as Record<string, any>,
        failureReason: error.message,
        retriesExhausted: DLT_MAX_RETRIES,
        reprocessed: false,
      }),
    );

    this.retryCounts.delete(key);
    return true;
  }
}
