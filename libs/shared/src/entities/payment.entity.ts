import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../constants/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  transactionExternalId!: string;

  @Column({ type: 'uuid' })
  accountExternalIdDebit!: string;

  @Column({ type: 'uuid' })
  accountExternalIdCredit!: string;

  @Column({ type: 'int' })
  transferTypeId!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  value!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status!: PaymentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
