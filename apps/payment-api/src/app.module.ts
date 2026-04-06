import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/shared';
import { PaymentModule } from './payment/payment.module';
import { HealthModule } from './health/health.module';
import { StatusUpdaterModule } from './status-updater/status-updater.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    PaymentModule,
    HealthModule,
    StatusUpdaterModule,
  ],
})
export class AppModule {}
