import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopics, PaymentCreatedEvent } from '@app/shared';
import { LedgerService } from './ledger.service';

@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @EventPattern(KafkaTopics.PAYMENT_CREATED)
  async handlePaymentCreated(
    @Payload() event: PaymentCreatedEvent,
  ): Promise<void> {
    await this.ledgerService.processPaymentCreated(event);
  }
}
