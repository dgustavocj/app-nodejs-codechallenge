import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RelayService } from './relay/relay.service';

async function bootstrap() {
  const logger = new Logger('OutboxRelay');

  const app = await NestFactory.createApplicationContext(AppModule);

  const relayService = app.get(RelayService);

  const shutdown = async (signal: string) => {
    logger.log(`${signal} received, shutting down`);
    relayService.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.log('starting outbox relay...');
  await relayService.start();
}

bootstrap();
