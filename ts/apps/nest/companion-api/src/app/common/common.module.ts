import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CompanionModule } from '../companion/companion.module';
import loggerConfiguration from '../configuration/logger.configuration';
import sessionConfiguration from '../configuration/session.configuration';
import { IdentificationModule } from '../identification/identification.module';
import { StatsigConfigurationFactory } from '../configuration/statsig.configuration.factory';
import { InsurancesModule } from '../insurances/insurances.module';
import { TasksModule } from '../tasks/tasks.module';
import { ClinicalProvidersModule } from '../clinical-providers/clinical-providers.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PcpModule } from '../pcp/pcp.module';
import { ConsentsModule } from '../consents/consents.module';
import { SocialHistoryModule } from '../social-history/social-history.module';
import { LoggerModule } from '../logger/logger.module';
import { StatsigModule } from '@*company-data-covered*/nest-statsig';
import { DatadogModule, DatadogService } from '@*company-data-covered*/nest-datadog';
import { SegmentModule } from '@*company-data-covered*/nest-segment';
import { DatadogConfigurationFactory } from '../configuration/datadog.configuration.factory';
import { SegmentConfigurationFactory } from '../configuration/segment.configuration.factory';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [loggerConfiguration, sessionConfiguration],
      isGlobal: true,
    }),
    DatadogModule.forRootAsync({
      useClass: DatadogConfigurationFactory,
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL', 60),
        limit: config.get('THROTTLE_LIMIT', 100),
      }),
    }),
    SegmentModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: SegmentConfigurationFactory,
      isGlobal: true,
    }),
    StatsigModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: StatsigConfigurationFactory,
      isGlobal: true,
    }),
    LoggerModule,
    RouterModule.register([
      {
        path: 'companion',
        module: CompanionModule,
        children: [
          {
            path: ':linkId',
            children: [
              {
                path: 'clinical-providers',
                module: ClinicalProvidersModule,
              },
              {
                path: 'identification',
                module: IdentificationModule,
              },
              {
                path: 'insurances',
                module: InsurancesModule,
              },
              {
                path: 'primary-care-providers',
                module: PcpModule,
              },
              {
                path: 'pharmacies',
                module: PharmaciesModule,
              },
              {
                path: 'tasks',
                module: TasksModule,
              },
              {
                path: 'consents',
                module: ConsentsModule,
              },
              {
                path: 'social-history',
                module: SocialHistoryModule,
              },
            ],
          },
        ],
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CommonModule implements OnApplicationBootstrap {
  constructor(private config: ConfigService, private datadog: DatadogService) {}

  onApplicationBootstrap() {
    if (this.config.get<string>('NODE_ENV') !== 'test') {
      const name = 'app_version';
      const versionKey = 'GIT_SHA';
      const version = this.config.get(versionKey, 'unknown');
      const tags = { version };

      this.datadog.histogram(name, 1, tags);
    }
  }
}
