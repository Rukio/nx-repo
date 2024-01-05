import { Module, DynamicModule } from '@nestjs/common';
import { StatsigModuleAsyncOptions, StatsigModuleOptions } from './interfaces';
import StatsigCoreModule from './statsig-core.module';

@Module({})
export default class StatsigModule {
  static forRoot(options: StatsigModuleOptions): DynamicModule {
    return {
      module: StatsigModule,
      imports: [StatsigCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: StatsigModuleAsyncOptions): DynamicModule {
    return {
      module: StatsigModule,
      imports: [StatsigCoreModule.forRootAsync(options)],
    };
  }
}
