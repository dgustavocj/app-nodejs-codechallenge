import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

const KAFKA_CLIENT = 'KAFKA_CLIENT';

@Module({})
export class KafkaModule {
  static forProducer(clientId: string): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: KAFKA_CLIENT,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              transport: Transport.KAFKA,
              options: {
                client: {
                  clientId,
                  brokers: (
                    config.get<string>('KAFKA_BROKERS', 'localhost:9092')
                  ).split(','),
                },
                producer: {
                  allowAutoTopicCreation: true,
                },
              },
            }),
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}

export { KAFKA_CLIENT };
