import { EdRefusalQuestionnaire } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import AnswerDto from './ed-refusal-questionnaires-answers.dto';

export default class EdRefusalQuestionnariesResponseDto
  implements EdRefusalQuestionnaire
{
  @ApiPropertyOptional({
    description: 'The unique identifier of the Ed Refusal Questionnaire.',
    example: 'unique_id',
  })
  id?: number;

  @ApiPropertyOptional({
    description: 'The unique identifier of the user Id.',
    example: null,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'The unique identifier of the Care Request Id.',
    example: null,
  })
  careRequestId?: number;

  @ApiPropertyOptional({
    description: 'The unique identifier of the Ed Refusal Questionnaire.',
    example: null,
  })
  secondaryScreeningId?: number;

  @ApiPropertyOptional({
    description: 'The type of Ed Refusal Questionnaire',
    example: 'EdRefusalQuestionnaireScreening',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Acceptable flag for Ed Refusal Questionnaire',
    example: false,
  })
  acceptable?: boolean;

  @ApiProperty({
    description: 'The responses',
    example: [
      {
        id: 1,
        question:
          'Do you understand that we have recommended that you call 911 or go to the ER?',
        answer: true,
      },
      {
        id: 2,
        question: 'Are you the patient or MPOA?',
        answer: true,
      },
      {
        id: 3,
        question: 'What is today’s date and time?',
        answer: true,
      },
    ],
  })
  responses: AnswerDto[];
}
