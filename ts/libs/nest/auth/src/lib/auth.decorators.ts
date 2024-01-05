import { Inject } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './auth.module-definition';

export const InjectAuthOptions = () => Inject(MODULE_OPTIONS_TOKEN);
