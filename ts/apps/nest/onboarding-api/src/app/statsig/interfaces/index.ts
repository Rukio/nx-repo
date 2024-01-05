import {
  ModuleMetadata,
  Type,
  OptionalFactoryDependency,
  InjectionToken,
} from '@nestjs/common';
import { StatsigOptions } from 'statsig-node';

export interface StatsigModuleOptions {
  /** The secret api key corresponds the server secret key of Statsig. */
  secretApiKey: string;
  /** Properties for initializing the sdk with advanced options. */
  options: StatsigOptions;
}

export interface StatsigOptionsFactory {
  /** Returns an instance of Statsig. */
  createStatsigOptions(): Promise<StatsigModuleOptions> | StatsigModuleOptions;
}

export interface StatsigModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useClass?: Type<StatsigOptionsFactory>;
  useExisting?: Type<StatsigOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<StatsigModuleOptions> | StatsigModuleOptions;
}
