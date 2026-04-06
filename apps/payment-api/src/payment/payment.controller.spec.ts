import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus } from '@app/shared';
import { Request } from 'express';

const mockPayment: Payment = {
  id: 'id-1',
  transactionExternalId: 'txn-001',
  accountExternalIdDebit: 'debit-1',
  accountExternalIdCredit: 'credit-1',
  transferTypeId: 1,
  value: 200,
  status: PaymentStatus.PENDING,
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

const mockService = {
  createPayment: jest.fn().mockResolvedValue(mockPayment),
  findPayment: jest.fn().mockResolvedValue(mockPayment),
} as unknown as PaymentService;

describe('PaymentController', () => {
  const controller = new PaymentController(mockService);

  beforeEach(() => jest.clearAllMocks());

  it('should create a payment and return 201', async () => {
    const req = { headers: { 'x-correlation-id': 'corr-1' } } as unknown as Request;
    const dto = {
      accountExternalIdDebit: 'debit-1',
      accountExternalIdCredit: 'credit-1',
      transferTypeId: 1,
      value: 200,
    };

    const result = await controller.create(dto, req);

    expect(mockService.createPayment).toHaveBeenCalledWith(dto, 'corr-1');
    expect(result.transactionExternalId).toBe('txn-001');
    expect(result.transactionStatus.name).toBe('PENDING');
  });

  it('should retrieve existing payment by id', async () => {
    const result = await controller.findOne('txn-001');

    expect(mockService.findPayment).toHaveBeenCalledWith('txn-001');
    expect(result.transactionExternalId).toBe('txn-001');
    expect(result.value).toBe(200);
  });
});
