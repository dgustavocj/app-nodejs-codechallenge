import { PaymentMapper } from './payment.mapper';
import { Payment, PaymentStatus } from '@app/shared';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  const p = new Payment();
  p.transactionExternalId = 'txn-001';
  p.transferTypeId = 1;
  p.status = PaymentStatus.PENDING;
  p.value = 100;
  p.createdAt = new Date('2025-06-15');
  p.updatedAt = new Date('2025-06-15');
  Object.assign(p, overrides);
  return p;
}

describe('PaymentMapper', () => {
  it('maps entity to response dto', () => {
    const result = PaymentMapper.toResponse(makePayment());

    expect(result.transactionExternalId).toBe('txn-001');
    expect(result.value).toBe(100);
    expect(result.transactionStatus.name).toBe('PENDING');
    expect(result.transactionType.name).toBe('credit');
  });

  it('maps transfer type ids correctly', () => {
    expect(PaymentMapper.toResponse(makePayment({ transferTypeId: 1 })).transactionType.name).toBe('credit');
    expect(PaymentMapper.toResponse(makePayment({ transferTypeId: 2 })).transactionType.name).toBe('debit');
    expect(PaymentMapper.toResponse(makePayment({ transferTypeId: 99 })).transactionType.name).toBe('unknown');
  });

  it('handles decimal value from postgres as string', () => {
    // pg devuelve decimals como strings
    const result = PaymentMapper.toResponse(makePayment({ value: '250.50' as unknown as number }));
    expect(result.value).toBe(250.5);
    expect(typeof result.value).toBe('number');
  });
});
