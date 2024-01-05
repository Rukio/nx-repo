import { ConfigurableModuleBuilder } from '@nestjs/common';
import { SegmentModuleOptions } from './interfaces';

export const {
  ConfigurableModuleClass: SegmentConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: SEGMENT_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<SegmentModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createSegmentOptions')
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
