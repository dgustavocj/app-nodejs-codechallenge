import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/shared';
import { RelayModule } from './relay/relay.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // DatabaseModule lo necesita
    DatabaseModule,
    RelayModule,
  ],
})
export class AppModule {}
