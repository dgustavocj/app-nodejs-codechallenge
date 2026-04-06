import { validate } from 'class-validator';
import { CreatePaymentDto } from './payment.dto';

function buildDto(overrides: Partial<CreatePaymentDto> = {}): CreatePaymentDto {
  const dto = new CreatePaymentDto();
  dto.accountExternalIdDebit = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  dto.accountExternalIdCredit = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  dto.transferTypeId = 1;
  dto.value = 500;
  Object.assign(dto, overrides);
  return dto; //
}

describe('CreatePaymentDto validation', () => {
  it('valid dto passes', async () => {
    const errors = await validate(buildDto());
    expect(errors).toHaveLength(0);
  });

  it('rejects non-uuid account ids', async () => {
    const errors = await validate(buildDto({ accountExternalIdDebit: 'nope' }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects negative values', async () => {
    const errors = await validate(buildDto({ value: -10 }));
    expect(errors.length).toBeGreaterThan(0);
  });
});
