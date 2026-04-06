import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent, KAFKA_CLIENT } from '@app/shared';

@Injectable()
export class RelayService implements OnModuleInit {
  private readonly logger = new Logger(RelayService.name);
  private running = false;
  private readonly pollMs = Number(process.env.OUTBOX_RELAY_POLL_INTERVAL_MS ?? 1000);
  private readonly batchSize = Number(process.env.OUTBOX_RELAY_BATCH_SIZE ?? 100);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async start(): Promise<void> {
    this.running = true;
    this.logger.log(`relay started (poll=${this.pollMs}ms, batch=${this.batchSize})`);

    while (this.running) {
      try {
        await this.pollAndPublish();
      } catch (err) {
        this.logger.error('poll cycle error', err instanceof Error ? err.stack : err);
      }

      if (this.running) {
        await new Promise((r) => setTimeout(r, this.pollMs));
      }
    }

    this.logger.log('relay stopped');
  }

  stop() {
    this.running = false;
  }

  private async pollAndPublish(): Promise<void> {
    const events = await this.outboxRepo.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: this.batchSize,
    });

    if (!events.length) return;

    this.logger.log(`found ${events.length} unpublished event(s)`);

    let count = 0;
    for (const evt of events) {
      try {
        this.kafkaClient.emit(evt.topic, {
          key: evt.eventId,
          value: JSON.stringify(evt.payload),
        });

        evt.published = true;
        evt.publishedAt = new Date();
        await this.outboxRepo.save(evt);
        count++;
      } catch (err) {
        this.logger.error(
          `failed to publish ${evt.eventId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    if (count > 0) {
      this.logger.log(`published ${count}/${events.length}`);
    }
  }
}
