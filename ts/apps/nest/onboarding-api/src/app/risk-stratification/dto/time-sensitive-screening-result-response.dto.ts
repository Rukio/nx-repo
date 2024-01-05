import { ApiProperty } from '@nestjs/swagger';
import {
  TimeSensitiveQuestion,
  TimeSensitiveScreeningResultResponse,
} from '@*company-data-covered*/consumer-web-types';

export default class TimeSensitiveScreeningResultResponseDTO
  implements TimeSensitiveScreeningResultResponse
{
  @ApiProperty({
    description: 'Time sensitive questions for secondary screening',
    example: {
      id: 'uuid',
      surveyVersionId: 'uuid',
      question:
        'Do the patient’s symptoms seem MOST likely related to Acute Heart Attack or Acute Coronary Syndrome (ACS)?',
      signs: {
        signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
      },
      displayOrder: 1,
    },
  })
  question: TimeSensitiveQuestion;

  @ApiProperty({
    description: 'Answer',
    example: true,
  })
  answer: boolean;
}
