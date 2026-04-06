import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('dead_letter_events')
export class DeadLetterEventRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'varchar', length: 255 })
  originalTopic!: string;

  @Column({ type: 'jsonb' })
  originalPayload!: Record<string, any>;

  @Column({ type: 'text' })
  failureReason!: string;

  @Column({ type: 'int' })
  retriesExhausted!: number;

  @Column({ type: 'boolean', default: false })
  reprocessed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
