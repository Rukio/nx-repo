import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import { PATIENTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/service';
import VariablesConfigText, {
  ONBOARDING_AUTH_CONFIG_SETTINGS,
} from '../common/variables.config';
import PatientController from './patient.controller';
import PatientService from './patient.service';
import {
  Auth0ConfigurationFactory,
  AuthModule,
} from '@*company-data-covered*/nest/auth';
import InsuranceNetworksModule from '../insurance-networks/insurance-networks.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    InsuranceNetworksModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Auth0ConfigurationFactory(configService, {
          ...ONBOARDING_AUTH_CONFIG_SETTINGS,
          audienceKey: VariablesConfigText.PatientsAudienceKey,
          tokenKey: VariablesConfigText.PatientsTokenKey,
        }).createAuthOptions();
      },
    }),
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [PatientController],
  providers: [
    PatientService,
    {
      provide: PATIENTS_PACKAGE_NAME,
      useFactory: (configService: ConfigService) => {
        const grpcOptions = configService.get('patientOptions');

        return ClientProxyFactory.create(grpcOptions);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PatientService, HttpModule],
})
export default class PatientModule {}
