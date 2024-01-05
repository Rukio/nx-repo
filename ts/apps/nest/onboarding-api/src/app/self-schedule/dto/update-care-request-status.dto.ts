import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { OssCareRequestStatusPayload } from '@*company-data-covered*/consumer-web-types';

export default class UpdateCareRequestStatusDto
  implements OssCareRequestStatusPayload
{
  @ApiProperty({
    description: 'The care request id',
    example: '1234',
  })
  careRequestId: string;

  @ApiProperty({
    description: 'New care request status',
    example: 'archived',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Patient declined',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'The shift team id',
    example: 141659,
  })
  @IsNumber()
  @IsOptional()
  shiftTeamId?: number;

  @ApiPropertyOptional({
    description: 'The reason for Shift team reassignment',
    example: 'Patient Time Window needs adjustment',
  })
  @IsString()
  @IsOptional()
  reassignmentReasonText?: string;

  @ApiPropertyOptional({
    description: 'The other reason for Shift team reassignment',
    example: 'Free Text',
  })
  @IsString()
  @IsOptional()
  reassignmentReasonOtherText?: string;
}
