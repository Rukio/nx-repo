import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import LoggerModule from './logger/logger.module';
import LoggerMiddleware from './logger/logger.middleware';
import AssignTeamModule from './assign-team/assign-team.module';
import ChannelItemsModule from './channel-items/channel-items.module';
import MarketModule from './market/market.module';
import HealthCheckModule from './health-check/health-check.module';
import EdRefusalQuestionnairesModule from './ed-refusal-questionnaires/ed-refusal-questionnaires.module';
import InsuranceModule from './insurance/insurance.module';
import CreditCardModule from './credit-card/credit-card.module';
import InsurancePlansModule from './insurance-plans/insurance-plans.module';
import InformedRequestorsModule from './informed-requestor/informed-requestor.module';
import ClientConfigModule from './client-config/client-config.module';
import UserModule from './user/user.module';
import StateModule from './state/state.module';
import ServiceLinesModule from './service-lines/service-lines.module';
import SecondaryScreeningModule from './secondary-screening/secondary-screening.module';
import SymptomsModule from './symptoms/symptoms.module';
import RiskStratificationProtocolsModule from './risk-stratification-protocols/risk-stratification-protocols.module';
import RiskAssessmentsModule from './risk-assessment/risk-assessment.module';
import MpoaConsentModule from './mpoa-consent/mpoa-consent.module';
import MarketAvailabilityModule from './market-availability/market-availability.module';
import PartnerLinesModule from './partner-lines/partner-lines.module';
import NoteModule from './note/note.module';
import ProvidersModule from './providers/providers.module';
import PlacesOfServiceModule from './places-of-service/places-of-service.module';
import ShiftTeamsModule from './shift-teams/shift-teams.module';
import AdvancedCareModule from './advanced-care/advanced-care.module';
import RiskStratificationModule from './risk-stratification/risk-stratification.module';
import StatsigModule from './statsig/statsig.module';
import StatsigConfigurationFactory from './configuration/statsig.configuration.factory';
import PatientModule from './patient/patient.module';
import CareRequestModule from './care-request/care-request.module';
import InsuranceNetworksModule from './insurance-networks/insurance-networks.module';
import grpcPatientsConfiguration from './configuration/grpc.patients.configuration';
import grpcPatientAccountsConfiguration from './configuration/grpc.patient-accounts.configuration';
import SelfSchedule from './self-schedule/self-schedule.module';
import PatientAccountsModule from './patient-accounts/patient-accounts.module';
import JwtModule from './jwt/jwt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [grpcPatientsConfiguration, grpcPatientAccountsConfiguration],
      isGlobal: true,
    }),
    AssignTeamModule,
    PatientModule,
    CareRequestModule,
    ChannelItemsModule,
    LoggerModule,
    EdRefusalQuestionnairesModule,
    MarketModule,
    InsuranceModule,
    CreditCardModule,
    InsurancePlansModule,
    InformedRequestorsModule,
    ClientConfigModule,
    HealthCheckModule,
    UserModule,
    StateModule,
    SymptomsModule,
    ServiceLinesModule,
    SecondaryScreeningModule,
    RiskStratificationProtocolsModule,
    RiskAssessmentsModule,
    MpoaConsentModule,
    MarketAvailabilityModule,
    PartnerLinesModule,
    NoteModule,
    ProvidersModule,
    PlacesOfServiceModule,
    ShiftTeamsModule,
    AdvancedCareModule,
    SelfSchedule,
    RiskStratificationModule,
    InsuranceNetworksModule,
    SelfSchedule,
    StatsigModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: StatsigConfigurationFactory,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('ONBOARDING_THROTTLE_TTL', 60),
        limit: config.get('ONBOARDING_THROTTLE_LIMIT', 100),
      }),
    }),
    PatientAccountsModule,
    JwtModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export default class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
