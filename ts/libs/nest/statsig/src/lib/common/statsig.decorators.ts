import { Inject } from '@nestjs/common';
import { STATSIG_MODULE_OPTIONS_TOKEN } from '../statsig.module-definition';

export const InjectStatsigOptions = () => Inject(STATSIG_MODULE_OPTIONS_TOKEN);
