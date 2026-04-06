import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface SagaResults {
  fraud?: { approved: boolean; reason?: string };
  ledger?: { recorded: boolean; reason?: string };
}

@Entity('payment_status_tracking')
export class PaymentStatusTracking {
  @PrimaryColumn({ type: 'uuid' })
  @Index()
  transactionExternalId!: string;

  @Column({ type: 'jsonb', default: {} })
  results!: SagaResults;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
