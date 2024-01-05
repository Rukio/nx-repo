import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';
import { CaravanConsentsAdapter } from './caravan-consents.adapter';
import { CaravanAdapter } from './caravan.adapter';
import { CaravanRequester } from './caravan.requester';

@Module({
  imports: [
    HttpModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Auth0ConfigurationFactory(configService, {
          domainKey: 'AUTH0_DOMAIN',
          clientIdKey: 'COMPANION_API_AUTH0_CLIENT_ID',
          clientSecretKey: 'COMPANION_API_AUTH0_CLIENT_SECRET',
          audienceKey: 'AUTH0_CARAVAN_CONSENTS_AUDIENCE',
          issuerKey: 'AUTH0_ISSUER_URL',
          tokenKey: 'STATION',
        }).createAuthOptions();
      },
    }),
  ],
  providers: [CaravanAdapter, CaravanRequester, CaravanConsentsAdapter],
  exports: [CaravanAdapter],
})
export class CaravanModule {}
