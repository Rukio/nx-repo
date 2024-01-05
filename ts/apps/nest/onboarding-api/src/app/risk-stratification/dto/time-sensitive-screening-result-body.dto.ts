import { TimeSensitiveScreeningResultBody } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export default class TimeSensitiveScreeningResultBodyDTO
  implements TimeSensitiveScreeningResultBody
{
  @ApiProperty({
    description: 'Care Request ID',
    example: 612985,
  })
  careRequestId: number;

  @ApiProperty({
    description:
      'Was the patient escalated to the emergency department during screening',
    example: true,
  })
  escalated: boolean;

  @ApiProperty({
    description: 'The UUID v4 of the Survey Version Id',
    example: 'uuid',
  })
  surveyVersionId: string;

  @ApiProperty({
    description:
      'The UUID v4 of the time sensitive question that escalated the patient to the Emergency Department',
    example: 'uuid',
  })
  @IsOptional()
  escalatedQuestionId?: string;
}
