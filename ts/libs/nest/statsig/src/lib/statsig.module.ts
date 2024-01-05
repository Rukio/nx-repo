import { Module } from '@nestjs/common';
import { StatsigConfigurableModuleClass } from './statsig.module-definition';
import { StatsigService } from './statsig.service';

@Module({
  providers: [StatsigService],
  exports: [StatsigService],
})
export class StatsigModule extends StatsigConfigurableModuleClass {}
