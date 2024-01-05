import { forwardRef, Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PcpController } from './pcp.controller';
import { PcpRepository } from './pcp.repository';

@Module({
  imports: [forwardRef(() => CompanionModule), DashboardModule],
  controllers: [PcpController],
  providers: [PcpRepository],
  exports: [PcpRepository],
})
export class PcpModule {}
