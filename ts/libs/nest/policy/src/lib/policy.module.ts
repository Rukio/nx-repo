import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PolicyConfigurableModuleClass } from './policy.module-definition';
import { PolicyService } from './policy.service';

@Module({
  imports: [HttpModule],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule extends PolicyConfigurableModuleClass {}
