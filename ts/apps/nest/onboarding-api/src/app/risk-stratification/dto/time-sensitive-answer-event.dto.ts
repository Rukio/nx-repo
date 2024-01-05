import { ApiProperty } from '@nestjs/swagger';
import { TimeSensitiveAnswerEvent } from '@*company-data-covered*/consumer-web-types';
import { IsBoolean } from 'class-validator';

export default class TimeSensitiveAnswerEventDTO
  implements TimeSensitiveAnswerEvent
{
  @ApiProperty({
    description: 'Whether to escalate the patient to the emergency department.',
    example: true,
  })
  @IsBoolean()
  escalate: boolean;
}
