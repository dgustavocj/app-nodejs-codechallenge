import { Payment, PaymentResponseDto } from '@app/shared';

export class PaymentMapper {
  static toResponse(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.transactionExternalId = payment.transactionExternalId;
    dto.transactionType = {
      name: PaymentMapper.mapTransferType(payment.transferTypeId),
    };
    dto.transactionStatus = { name: payment.status };
    dto.value = Number(payment.value);
    dto.createdAt = payment.createdAt;
    return dto;
  }

  private static mapTransferType(transferTypeId: number): string {
    switch (transferTypeId) {
      case 1:
        return 'credit';
      case 2:
        return 'debit';
      default:
        return 'unknown';
    }
  }
}
