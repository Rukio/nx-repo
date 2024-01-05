import { InformedQuestion } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class InformedQuestionDto implements InformedQuestion {
  @ApiProperty({
    description: 'The question',
    example: 'Are you currently with the patient?',
  })
  question: string;

  @ApiProperty({
    description: 'The answer to the question',
    example: 'No',
  })
  answer: string;
}
