export const KafkaTopics = {
  PAYMENT_CREATED: 'payment.created.v1',
  PAYMENT_FRAUD_RESULT: 'payment.fraud-result.v1',
  PAYMENT_LEDGER_RESULT: 'payment.ledger-result.v1',
  PAYMENT_SETTLED: 'payment.settled.v1',
  PAYMENT_FAILED: 'payment.failed.v1', // DLT
} as const;

export const KafkaConsumerGroups = {
  FRAUD: 'fraud-consumer-group',
  LEDGER: 'ledger-consumer-group',
  STATUS_SAGA: 'status-saga-group',
} as const;

export const DLT_MAX_RETRIES = 3;
