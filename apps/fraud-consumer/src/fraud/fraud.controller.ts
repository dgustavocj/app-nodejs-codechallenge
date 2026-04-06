import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopics } from '@app/shared/constants';
import { PaymentCreatedEvent } from '@app/shared/contracts';
import { FraudService } from './fraud.service';

@Controller()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @EventPattern(KafkaTopics.PAYMENT_CREATED)
  async handlePaymentCreated(
    @Payload() event: PaymentCreatedEvent,
  ): Promise<void> {
    await this.fraudService.processPaymentCreated(event);
  }
}
