import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CareRequestModule } from './care-request/care-request.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CompanionModule } from './companion/companion.module';
import { CommunicationsModule } from './communications/communications.module';
import { CommonModule } from './common/common.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { IdentificationModule } from './identification/identification.module';
import { InsurancesModule } from './insurances/insurances.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServerErrorFilter } from './filters/server-error.filter';
import { TasksModule } from './tasks/tasks.module';
import { ClinicalProvidersModule } from './clinical-providers/clinical-providers.module';
import { PharmaciesModule } from './pharmacies/pharmacies.module';
import { PcpModule } from './pcp/pcp.module';
import { ConsentsModule } from './consents/consents.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { SocialHistoryModule } from './social-history/social-history.module';
import { CaravanModule } from './caravan/caravan.module';
import { DatadogTraceModule } from 'nestjs-ddtrace';
import { BullConfigService } from './configuration/bull.configuration';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from './redis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [RedisModule],
      useClass: BullConfigService,
    }),
    CareRequestModule,
    HealthCheckModule,
    DashboardModule,
    // TODO: Remove `as never` cast once below issue is solved and package is updated
    // v3.0.1 just removes TS types entirely so that won't work either
    // https://github.com/codebrick-corp/nestjs-ddtrace/issues/9
    DatadogTraceModule.forRoot({
      controllers: true,
      providers: true,
      services: true,
    } as never),
    ClinicalProvidersModule,
    CompanionModule,
    CommunicationsModule,
    CommonModule,
    IdentificationModule,
    InsurancesModule,
    PharmaciesModule,
    PcpModule,
    TasksModule,
    ConsentsModule,
    SocialHistoryModule,
    CaravanModule,
    RedisModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ServerErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
