import { DatadogModuleOptions } from '@*company-data-covered*/nest-datadog';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';

@Injectable()
export class DatadogConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      DatadogModuleOptions,
      'createDatadogOptions'
    >
{
  createDatadogOptions(): DatadogModuleOptions {
    // TODO: Figure out why a configuration factory is needed for the datadog module.
    return {};
  }
}
