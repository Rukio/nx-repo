import { ConfigurableModuleBuilder } from '@nestjs/common';
import { RedisOptions } from 'ioredis';

export type RedisModuleOptions = RedisOptions;

export const {
  ConfigurableModuleClass: RedisConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: REDIS_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<RedisModuleOptions>()
  .setClassMethodName('register')
  .setFactoryMethodName('createRedisOptions')
  .build();
