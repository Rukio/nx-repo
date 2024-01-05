import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatsigEnvironment } from 'statsig-node';
import MissingEnvironmentVariableException from '../common/exceptions/missing-environment-variable.exception';
import {
  StatsigModuleOptions,
  StatsigOptionsFactory,
} from '../statsig/interfaces';

@Injectable()
export default class StatsigConfigurationFactory
  implements StatsigOptionsFactory
{
  constructor(private config: ConfigService) {}

  createStatsigOptions(): StatsigModuleOptions {
    const secretApiKey = this.config.get<string>(
      'STATSIG_SDK_SERVER_SECRET_KEY'
    );
    if (!secretApiKey) {
      throw new MissingEnvironmentVariableException(
        'STATSIG_SDK_SERVER_SECRET_KEY'
      );
    }
    const tier = this.config.get<StatsigEnvironment['tier']>(
      'STATSIG_ENVIRONMENT'
    );

    return {
      secretApiKey,
      options: {
        environment: {
          tier,
        },
      },
    };
  }
}
