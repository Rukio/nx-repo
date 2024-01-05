import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpHealthIndicator } from '@nestjs/terminus';
import {
  AuthModule,
  Auth0ConfigurationFactory,
} from '@*company-data-covered*/nest/auth';
import { CacheConfigService } from '../common/cache.config.service';
import { DashboardHealthIndicator } from './dashboard.health';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Auth0ConfigurationFactory(configService, {
          domainKey: 'AUTH0_DOMAIN',
          clientIdKey: 'COMPANION_API_AUTH0_CLIENT_ID',
          clientSecretKey: 'COMPANION_API_AUTH0_CLIENT_SECRET',
          audienceKey: 'AUTH0_STATION_AUDIENCE',
          issuerKey: 'AUTH0_ISSUER_URL',
          tokenKey: 'STATION',
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  providers: [DashboardService, DashboardHealthIndicator, HttpHealthIndicator],
  exports: [DashboardService, DashboardHealthIndicator],
})
export class DashboardModule {}
