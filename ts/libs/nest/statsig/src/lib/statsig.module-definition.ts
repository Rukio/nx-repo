import { ConfigurableModuleBuilder } from '@nestjs/common';
import { StatsigModuleOptions } from './interfaces';

export const {
  ConfigurableModuleClass: StatsigConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: STATSIG_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<StatsigModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createStatsigOptions')
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    })
  )
  .build();
