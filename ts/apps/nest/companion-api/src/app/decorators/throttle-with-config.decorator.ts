import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

interface ThrottleConfigParams {
  ttlKey: string;
  limitKey: string;
  ttlDefault?: number;
  limitDefault?: number;
}

export function ThrottleWithConfig(config: ThrottleConfigParams) {
  const configService = new ConfigService();

  const requestLimit = configService.get(config.limitKey, config.limitDefault);
  const ttlSeconds = configService.get(config.ttlKey, config.ttlDefault);

  return Throttle(requestLimit, ttlSeconds);
}
