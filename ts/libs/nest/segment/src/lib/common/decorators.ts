import { Inject } from '@nestjs/common';
import { SEGMENT_MODULE_OPTIONS_TOKEN } from '../segment.module-definition';

export const InjectSegmentOptions = () => Inject(SEGMENT_MODULE_OPTIONS_TOKEN);
