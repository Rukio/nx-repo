import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import InsuranceNetworksController from './insurance-networks.controller';
import InsuranceNetworksService from './insurance-networks.service';
import LoggerModule from '../logger/logger.module';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';
import VariablesConfigText, {
  ONBOARDING_AUTH_CONFIG_SETTINGS,
} from '../common/variables.config';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Auth0ConfigurationFactory(configService, {
          ...ONBOARDING_AUTH_CONFIG_SETTINGS,
          audienceKey: VariablesConfigText.InsuranceServiceAudienceKey,
          tokenKey: VariablesConfigText.InsuranceServiceTokenKey,
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [InsuranceNetworksController],
  providers: [InsuranceNetworksService],
  exports: [InsuranceNetworksService, HttpModule],
})
export default class InsuranceNetworksModule {}
