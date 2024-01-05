import { InjectQueue as BullInjectQueue } from '@nestjs/bull';

// InjectQueue is defined in its library using a legacy ParameterDecorator type from TypeScript, this cast overrides that.
export const InjectQueue = BullInjectQueue as (
  name?: string
) => (target: object, key: string | symbol | undefined, index?: number) => void;
