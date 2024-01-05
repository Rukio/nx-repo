import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ClientOptions } from 'hot-shots';

export type DatadogModuleOptions = ClientOptions;

export const {
  ConfigurableModuleClass: DatadogConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: DATADOG_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<DatadogModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createDatadogOptions')
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
