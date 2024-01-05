import { PolicyModuleOptions } from '@*company-data-covered*/nest/policy';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import getRequiredEnvironmentVariable from './utility/utils';

@Injectable()
export class PolicyConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      PolicyModuleOptions,
      'createPolicyOptions'
    >
{
  constructor(private config: ConfigService) {}

  createPolicyOptions(): PolicyModuleOptions {
    const policyServiceBaseUrl = getRequiredEnvironmentVariable(
      'POLICY_SERVICE_BASE_URL',
      this.config
    );

    return {
      policyServiceBaseUrl,
    };
  }
}
