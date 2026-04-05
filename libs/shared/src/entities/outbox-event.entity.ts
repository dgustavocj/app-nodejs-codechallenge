import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  eventId!: string;

  @Column({ type: 'uuid' })
  correlationId!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'varchar', length: 255 })
  topic!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  @Index()
  published!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;
}
