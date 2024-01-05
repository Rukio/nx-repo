import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import AdvancedCareService from './advanced-care.service';
import AdvancedCareController from './advanced-care.controller';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';
import { ONBOARDING_AUTH_CONFIG_SETTINGS } from '../common/variables.config';

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
          audienceKey: 'M2M_CARE_MANAGER_SERVICE_AUDIENCE',
          tokenKey: 'CARE_MANAGER_SERVICE',
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [AdvancedCareController],
  providers: [AdvancedCareService],
  exports: [AdvancedCareService, HttpModule],
})
export default class AdvancedCareModule {}
