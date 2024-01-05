import { Module } from '@nestjs/common';
import { DatadogConfigurableModuleClass } from './datadog.module-definition';
import { DatadogService } from './datadog.service';

@Module({
  providers: [DatadogService],
  exports: [DatadogService],
})
export class DatadogModule extends DatadogConfigurableModuleClass {}
