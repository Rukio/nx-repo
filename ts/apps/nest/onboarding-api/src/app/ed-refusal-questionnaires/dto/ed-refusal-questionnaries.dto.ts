import { EdRefusalQuestionnaire } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import AnswerDto from './ed-refusal-questionnaires-answers.dto';

export default class EdRefusalQuestionnariesDto
  implements EdRefusalQuestionnaire
{
  @ApiProperty({
    description: 'The unique identifier of the Ed Refusal Questionnaire.',
    example: null,
    type: Number,
  })
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty({
    description: 'The unique identifier of the Ed Refusal Questionnaire.',
    example: null,
    type: Number,
  })
  @ApiPropertyOptional()
  secondaryScreeningId?: number;

  @ApiProperty({
    description: 'The type of EdRefusalQuestionnaire',
    example: 'EdRefusalQuestionnaireScreening',
    type: String,
  })
  @ApiPropertyOptional()
  type?: string;

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
