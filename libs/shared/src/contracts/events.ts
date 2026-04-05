export interface DomainEvent<T = unknown> {
  eventId: string;
  correlationId: string;
  eventType: string;
  version: number;
  timestamp: string;
  payload: T;
}


export interface PaymentCreatedPayload {
  transactionExternalId: string;
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transferTypeId: number;
  value: number;
}

export type PaymentCreatedEvent = DomainEvent<PaymentCreatedPayload>;


export interface FraudResultPayload {
  transactionExternalId: string;
  approved: boolean;
  reason: string | null;
}

export type FraudResultEvent = DomainEvent<FraudResultPayload>;


export interface LedgerResultPayload {
  transactionExternalId: string;
  recorded: boolean;
  ledgerEntryId: string | null;
  reason: string | null;
}

export type LedgerResultEvent = DomainEvent<LedgerResultPayload>;


export interface PaymentSettledPayload {
  transactionExternalId: string;
  fraudApproved: boolean;
  ledgerRecorded: boolean;
  ledgerEntryId: string | null;
}

export type PaymentSettledEvent = DomainEvent<PaymentSettledPayload>;


export interface DeadLetterPayload {
  originalTopic: string;
  originalEvent: DomainEvent;
  failureReason: string;
  retriesExhausted: number;
}

export type DeadLetterEvent = DomainEvent<DeadLetterPayload>;
