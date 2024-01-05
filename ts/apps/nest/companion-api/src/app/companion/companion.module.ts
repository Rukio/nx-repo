import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CareRequestModule } from '../care-request/care-request.module';
import { CommunicationsModule } from '../communications/communications.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DatabaseModule } from '../database/database.module';
import { IdentificationModule } from '../identification/identification.module';
import { InsurancesModule } from '../insurances/insurances.module';
import { TasksModule } from '../tasks/tasks.module';
import { CompanionController } from './companion.controller';
import { CompanionSerializer } from './companion.serializer';
import { CompanionService } from './companion.service';
import { CompanionStrategy } from './companion.strategy';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PcpModule } from '../pcp/pcp.module';
import { ConsentsModule } from '../consents/consents.module';
import { SocialHistoryModule } from '../social-history/social-history.module';
import { JobsModule } from '../jobs/jobs.module';
import { RedisModule } from '../redis';

@Module({
  imports: [
    RedisModule,
    DashboardModule,
    DatabaseModule,
    ConfigModule,
    CareRequestModule,
    CommunicationsModule,
    JobsModule,
    forwardRef(() => SocialHistoryModule),
    forwardRef(() => IdentificationModule),
    forwardRef(() => InsurancesModule),
    forwardRef(() => PcpModule),
    forwardRef(() => PharmaciesModule),
    forwardRef(() => TasksModule),
    forwardRef(() => ConsentsModule),
  ],
  controllers: [CompanionController],
  providers: [
    CompanionService,
    CompanionStrategy,
    CompanionSerializer, // automatically invoked when added as provider
  ],
  exports: [CompanionService],
})
export class CompanionModule {}
