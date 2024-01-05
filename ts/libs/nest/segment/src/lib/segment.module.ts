import { Module } from '@nestjs/common';
import { SegmentConfigurableModuleClass } from './segment.module-definition';
import { SegmentService } from './segment.service';

@Module({
  providers: [SegmentService],
  exports: [SegmentService],
})
export class SegmentModule extends SegmentConfigurableModuleClass {}
