import { EdRefusalQuestionnaireResponse } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class AnswerDto implements EdRefusalQuestionnaireResponse {
  @ApiProperty({
    description: 'The question id',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The question',
    example:
      'Do you understand that we have recommended that you call 911 or go to the ER?',
  })
  question: string;

  @ApiProperty({
    description: 'The answer to the question',
    example: true,
  })
  answer: boolean;
}
