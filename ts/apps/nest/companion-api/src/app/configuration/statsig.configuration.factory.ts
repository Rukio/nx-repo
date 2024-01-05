import { StatsigModuleOptions } from '@*company-data-covered*/nest-statsig';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatsigEnvironment } from 'statsig-node';
import { MissingEnvironmentVariableException } from '../common/exceptions/missing-environment-variable.exception';

@Injectable()
export class StatsigConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      StatsigModuleOptions,
      'createStatsigOptions'
    >
{
  constructor(private config: ConfigService) {}

  createStatsigOptions(): StatsigModuleOptions {
    const secretKey = 'STATSIG_SDK_SERVER_SECRET_KEY';
    const secretApiKey = this.config.get<string>(secretKey);

    if (!secretApiKey) {
      throw new MissingEnvironmentVariableException(secretKey);
    }

    const tierKey = 'STATSIG_ENVIRONMENT';
    const tier = this.config.get<StatsigEnvironment['tier']>(tierKey);

    return {
      secretApiKey,
      options: {
        environment: {
          tier: tier,
        },
      },
    };
  }
}
