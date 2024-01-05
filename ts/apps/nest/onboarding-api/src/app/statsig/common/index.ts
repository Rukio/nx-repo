import { Inject } from '@nestjs/common';

export const STATSIG_OPTIONS_TOKEN = 'STATSIG_OPTIONS';
export const STATSIG_TOKEN = 'STATSIG_SERVICE';

export const InjectStatsigOptions = () => Inject(STATSIG_OPTIONS_TOKEN);
export const InjectStatsig = () => Inject(STATSIG_TOKEN);
