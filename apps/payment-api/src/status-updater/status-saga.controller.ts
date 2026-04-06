import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  KafkaTopics,
  DomainEvent,
  FraudResultPayload,
  LedgerResultPayload,
  FraudResultEvent,
  LedgerResultEvent,
} from '@app/shared';
import { StatusSagaService } from './status-saga.service';

@Controller()
export class StatusSagaController {
  private readonly logger = new Logger(StatusSagaController.name);

  constructor(private readonly sagaService: StatusSagaService) {}

  @EventPattern(KafkaTopics.PAYMENT_FRAUD_RESULT)
  async handleFraudResult(
    @Payload() message: DomainEvent<FraudResultPayload>,
  ): Promise<void> {
    const event = this.parseEvent<FraudResultPayload>(message) as FraudResultEvent;
    this.logger.log(`fraud result in for ${event.payload.transactionExternalId}`);
    await this.sagaService.handleFraudResult(event);
  }

  @EventPattern(KafkaTopics.PAYMENT_LEDGER_RESULT)
  async handleLedgerResult(
    @Payload() message: DomainEvent<LedgerResultPayload>,
  ): Promise<void> {
    const event = this.parseEvent<LedgerResultPayload>(message) as LedgerResultEvent;
    this.logger.log(`ledger result in for ${event.payload.transactionExternalId}`);
    await this.sagaService.handleLedgerResult(event);
  }

  // kafka can deliver string or already-parsed object
  private parseEvent<T>(message: unknown): DomainEvent<T> {
    if (typeof message === 'string') {
      return JSON.parse(message) as DomainEvent<T>;
    }
    return message as DomainEvent<T>;
  }
}
