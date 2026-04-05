import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('consumer_idempotency')
export class ConsumerIdempotency {
  @PrimaryColumn({ type: 'uuid' })
  eventId!: string;

  @PrimaryColumn({ type: 'varchar', length: 100 })
  consumerGroup!: string;

  @Column({ type: 'varchar', length: 50, default: 'processed' })
  status!: string;

  @CreateDateColumn()
  processedAt!: Date;
}
