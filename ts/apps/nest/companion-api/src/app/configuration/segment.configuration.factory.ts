import { SegmentModuleOptions } from '@*company-data-covered*/nest-segment';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRequiredEnvironmentVariable } from '../utility/utils';

@Injectable()
export class SegmentConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      SegmentModuleOptions,
      'createSegmentOptions'
    >
{
  constructor(private config: ConfigService) {}

  createSegmentOptions(): SegmentModuleOptions {
    const secretKey = 'SEGMENT_SDK_SOURCE_WRITE_KEY';
    const writeKey = getRequiredEnvironmentVariable(secretKey, this.config);
    const segmentIsDisabledKey = 'SEGMENT_DISABLED';
    const segmentIsDisabled =
      this.config.get<string>(segmentIsDisabledKey) === 'true';

    return {
      initializationSettings: { writeKey, disable: segmentIsDisabled },
    };
  }
}
