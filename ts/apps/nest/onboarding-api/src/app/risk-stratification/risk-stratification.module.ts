import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from '../common/cache.config.service';
import VariablesConfigText, {
  ONBOARDING_AUTH_CONFIG_SETTINGS,
} from '../common/variables.config';
import RiskStratificationService from './risk-stratification.service';
import RiskStratificationController from './risk-stratification.controller';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';

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
          audienceKey: VariablesConfigText.RiskStratificationAudienceKey,
          tokenKey: VariablesConfigText.RiskStratificationTokenKey,
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [RiskStratificationController],
  providers: [RiskStratificationService],
  exports: [RiskStratificationService, HttpModule],
})
export default class RiskStratificationModule {}
