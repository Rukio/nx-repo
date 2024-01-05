import { TimeSensitiveAnswerEventBody } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class TimeSensitiveAnswerEventBodyDTO
  implements TimeSensitiveAnswerEventBody
{
  @ApiProperty({
    description: 'Care Request ID',
    example: 612985,
  })
  careRequestId: number;

  @ApiProperty({
    description: 'Survey Version ID',
    example: '590e085a-a3f9-4db5-8fee-f1bbd0f03061',
  })
  surveyVersionId: string;

  @ApiProperty({
    description: 'Time Sensitive Answer',
    example: true,
  })
  answer: boolean;
}
