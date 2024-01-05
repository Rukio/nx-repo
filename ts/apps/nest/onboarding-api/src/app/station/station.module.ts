import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';
import { ONBOARDING_AUTH_CONFIG_SETTINGS } from '../common/variables.config';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from '../common/cache.config.service';
import StationService from './station.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Auth0ConfigurationFactory(configService, {
          ...ONBOARDING_AUTH_CONFIG_SETTINGS,
          audienceKey: 'M2M_STATION_AUDIENCE',
          tokenKey: 'STATION',
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  providers: [StationService],
  exports: [StationService, HttpModule],
})
export default class StationModule {}
