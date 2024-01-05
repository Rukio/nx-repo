import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import PatientAccountsService from './patient-accounts.service';
import { PATIENTS_ACCOUNTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from '../common/cache.config.service';
import PatientAccountsController from './patient-accounts.controller';
import { GRPCConfigEnum } from '../common/enums';
import PatientModule from '../patient/patient.module';
import LoggerModule from '../logger/logger.module';
import { PolicyModule } from '@*company-data-covered*/nest/policy';
import { PolicyConfigurationFactory } from '../configuration/policy.configuration.factory';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    PatientModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
    PolicyModule.forRootAsync({
      useClass: PolicyConfigurationFactory,
    }),
  ],
  controllers: [PatientAccountsController],
  providers: [
    PatientAccountsService,
    {
      provide: PATIENTS_ACCOUNTS_PACKAGE_NAME,
      useFactory: (configService: ConfigService) => {
        const grpcOptions = configService.get(GRPCConfigEnum.PATIENT_ACCOUNTS);

        return ClientProxyFactory.create(grpcOptions);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PatientAccountsService, HttpModule],
})
export default class PatientAccountsModule {}
