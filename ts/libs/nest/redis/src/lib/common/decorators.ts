import { Inject } from '@nestjs/common';
import { IOREDIS_CLIENT_TOKEN } from './constants';
import { REDIS_MODULE_OPTIONS_TOKEN } from '../redis.module-definition';

export const InjectRedis = () => Inject(IOREDIS_CLIENT_TOKEN);
export const InjectRedisOptions = () => Inject(REDIS_MODULE_OPTIONS_TOKEN);
