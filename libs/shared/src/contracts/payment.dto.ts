import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  accountExternalIdDebit!: string;

  @IsUUID()
  @IsNotEmpty()
  accountExternalIdCredit!: string;

  @IsNumber()
  @IsPositive()
  transferTypeId!: number;

  @IsNumber()
  @IsPositive()
  value!: number;
}

export class PaymentResponseDto {
  transactionExternalId!: string;
  transactionType!: { name: string };
  transactionStatus!: { name: string };
  value!: number;
  createdAt!: Date;
}
