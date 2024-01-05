import { Exclude } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CareRequestAcceptIfFeasible } from '@*company-data-covered*/consumer-web-types';
import UpdateCareRequestStatusDto from './update-care-request-status.dto';

export default class AcceptCareRequestIfFeasibleDto
  extends UpdateCareRequestStatusDto
  implements CareRequestAcceptIfFeasible
{
  @ApiHideProperty()
  @Exclude()
  status: string;

  @ApiProperty({
    description: 'If the feasibility check should be skiped',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  skipFeasibilityCheck: boolean;
}
