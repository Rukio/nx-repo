import { Inject } from '@nestjs/common';
import { DATADOG_MODULE_OPTIONS_TOKEN } from '../datadog.module-definition';

export const InjectDatadogOptions = () => Inject(DATADOG_MODULE_OPTIONS_TOKEN);
