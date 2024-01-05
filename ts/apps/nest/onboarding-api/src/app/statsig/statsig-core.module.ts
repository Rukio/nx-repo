import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { STATSIG_TOKEN, STATSIG_OPTIONS_TOKEN } from './common';
import {
  StatsigModuleAsyncOptions,
  StatsigModuleOptions,
  StatsigOptionsFactory,
} from './interfaces';
import StatsigService from './statsig.service';

@Global()
@Module({})
export default class StatsigCoreModule {
  static forRoot(options: StatsigModuleOptions): DynamicModule {
    const statsigProvider: Provider = {
      provide: STATSIG_TOKEN,
      useValue: new StatsigService(options),
    };

    return {
      module: StatsigCoreModule,
      providers: [statsigProvider],
      exports: [statsigProvider],
    };
  }

  public static forRootAsync(
    options: StatsigModuleAsyncOptions
  ): DynamicModule {
    const provider: Provider = {
      inject: [STATSIG_OPTIONS_TOKEN],
      provide: STATSIG_TOKEN,
      useFactory: async (opts: StatsigModuleOptions) => {
        const service = new StatsigService(opts);
        await service.initialize();

        return service;
      },
    };

    return {
      module: StatsigCoreModule,
      imports: [...(options.imports ?? [])],
      providers: [...this.createAsyncProviders(options), provider],
      exports: [provider],
    };
  }

  private static createAsyncProviders(
    options: StatsigModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const { useClass } = options;

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: StatsigModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        inject: options.inject || [],
        provide: STATSIG_OPTIONS_TOKEN,
        useFactory: options.useFactory,
      };
    }

    const inject = [options.useClass || options.useExisting];

    return {
      provide: STATSIG_OPTIONS_TOKEN,
      useFactory: async (optionsFactory: StatsigOptionsFactory) =>
        optionsFactory.createStatsigOptions(),
      inject,
    };
  }
}
