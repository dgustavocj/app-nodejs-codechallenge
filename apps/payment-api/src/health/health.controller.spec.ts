import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok', () => {
    const ctrl = new HealthController();
    expect(ctrl.check()).toEqual({ status: 'ok', service: 'payment-api' });
  });
});
