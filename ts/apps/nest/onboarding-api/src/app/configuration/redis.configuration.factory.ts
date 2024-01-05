import { RedisModuleOptions } from '@*company-data-covered*/nest/redis';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import getRequiredEnvironmentVariable from './utility/utils';

@Injectable()
export class RedisConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<RedisModuleOptions, 'createRedisOptions'>
{
  constructor(private config: ConfigService) {}

  createRedisOptions(): RedisModuleOptions {
    const urlString = getRequiredEnvironmentVariable(
      'ONBOARDING_REDIS_URL',
      this.config
    );
    const {
      username,
      password,
      port,
      hostname,
      pathname: path,
    } = new URL(urlString);

    return {
      username,
      password,
      host: hostname,
      port: port ? Number(port) : undefined,
      path,
    };
  }
}
