export enum PaymentStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}

export const TERMINAL_STATUSES = [
  PaymentStatus.REJECTED,
  PaymentStatus.SETTLED,
  PaymentStatus.FAILED,
] as const;
