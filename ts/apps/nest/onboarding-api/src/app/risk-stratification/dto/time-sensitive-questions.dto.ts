import { ApiProperty } from '@nestjs/swagger';
import {
  TimeSensitiveQuestion,
  RSTimeSensitiveQuestionSigns,
} from '@*company-data-covered*/consumer-web-types';

export default class TimeSensitiveQuestionsDTO
  implements TimeSensitiveQuestion
{
  @ApiProperty({
    description: 'Care Request ID',
    example: 612985,
  })
  id: string;

  @ApiProperty({
    description: 'Survey Version ID',
    example: '590e085a-a3f9-4db5-8fee-f1bbd0f03061',
  })
  surveyVersionId: string;

  @ApiProperty({
    description: 'Question body',
    example: 'Is the patient demonstrating evidence of respiratory distress?',
  })
  question: string;

  @ApiProperty({
    description: 'Signs that indicate the answer to the question is: "Yes"',
    example: {
      signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
    },
  })
  signs: RSTimeSensitiveQuestionSigns;

  @ApiProperty({
    description: 'Time Sensitive Answer',
    example: 1,
  })
  displayOrder: number;
}
