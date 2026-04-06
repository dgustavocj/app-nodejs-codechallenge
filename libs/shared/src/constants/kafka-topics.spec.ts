import { KafkaTopics, KafkaConsumerGroups } from './kafka-topics';

describe('KafkaTopics', () => {
  it('should have all required topics defined', () => {
    expect(KafkaTopics.PAYMENT_CREATED).toBeDefined();
    expect(KafkaTopics.PAYMENT_FRAUD_RESULT).toBeDefined();
    expect(KafkaTopics.PAYMENT_LEDGER_RESULT).toBeDefined();
    expect(KafkaTopics.PAYMENT_SETTLED).toBeDefined();
    expect(KafkaTopics.PAYMENT_FAILED).toBeDefined();
  });

  it('consumer groups should not collide', () => {
    const groups = Object.values(KafkaConsumerGroups);
    expect(new Set(groups).size).toBe(groups.length);
  });
});
