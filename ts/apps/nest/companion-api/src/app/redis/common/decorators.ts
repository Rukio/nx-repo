import { Inject } from '@nestjs/common';
import { IOREDIS_CLIENT_TOKEN, REDIS_OPTIONS_TOKEN } from './constants';

export const InjectRedis = () => Inject(IOREDIS_CLIENT_TOKEN);
export const InjectRedisOptions = () => Inject(REDIS_OPTIONS_TOKEN);
