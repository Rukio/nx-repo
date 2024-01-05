import { PickType } from '@nestjs/swagger';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';

export class CompanionLinkAnalytics extends PickType(CareRequestDto, [
  'statsigCareRequestId',
]) {}
