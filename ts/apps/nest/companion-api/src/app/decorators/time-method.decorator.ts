import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Times the decorated method and logs the result.
 *
 * This should only be used in non-production environments.
 *
 * @param {string} [title] - Optional timer title - defaults to the method name.
 */
export const TimeMethod = (title?: string): MethodDecorator => {
  const injectTimeLogger = Inject(WINSTON_MODULE_PROVIDER);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const timeLoggerKey = 'logger';

    if (!target[timeLoggerKey]) {
      injectTimeLogger(target, timeLoggerKey);
    }

    const originalMethod = descriptor.value;
    const timerTitle = title ?? propertyKey;

    descriptor.value = async function (...args: unknown[]) {
      const logger: Logger = this[timeLoggerKey as keyof typeof this];

      logger.profile(timerTitle.toString());
      const result = await originalMethod.apply(this, args);

      logger.profile(timerTitle.toString());

      return result;
    };

    return descriptor;
  };
};
