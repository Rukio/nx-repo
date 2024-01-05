import { Injectable, PipeTransform } from '@nestjs/common';
import SelfScheduleService from '../self-schedule.service';

@Injectable()
export class CacheByUserIdPipe implements PipeTransform {
  constructor(private selfScheduleService: SelfScheduleService) {}

  transform(userId: string) {
    return this.selfScheduleService.fetchCache(userId);
  }
}
