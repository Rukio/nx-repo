import {
  QuestionResponse,
  ServiceLineQuestionResponse,
} from '@*company-data-covered*/consumer-web-types';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class ServiceLineQuestionResponseDto
  implements ServiceLineQuestionResponse
{
  @ApiProperty({
    description: 'The id of the Service Line question reponse.',
    example: 0,
  })
  id: number;

  @ApiProperty({
    description: 'The service line id of the Service Line question reponse.',
    example: 1,
  })
  @IsNumber()
  serviceLineId: number;

  @ApiProperty({
    description: 'The user id of the Service Line question reponse.',
    example: 0,
  })
  userId: number;

  @ApiProperty({
    description: 'The care request id of the Service Line question reponse.',
    example: 0,
  })
  careRequestId: number;

  @ApiProperty({
    description: 'The responses of the Service Line question reponse.',
    example: [
      {
        id: 11,
        serviceLineId: 2,
        questionType: 'short_text',
        questionText: 'Question 1 - Short Text.',
        syncToAthena: false,
        order: 0,
        createdAt: '2020-10-09T16:47:42.724Z',
        updatedAt: '2020-10-09T16:47:42.724Z',
      },
    ],
    isArray: true,
  })
  responses: QuestionResponseDto[];

  @ApiProperty({
    description: 'The created time of the Service Line question reponse.',
    example: '2021-07-08T20:39:08.305Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'The updated time of the Service Line question reponse.',
    example: '2021-07-08T20:39:08.305Z',
  })
  updatedAt: string;
}

export class QuestionResponseDto implements QuestionResponse {
  @ApiProperty({
    description: 'The id of the reponse.',
    example: 0,
  })
  id: number;

  @ApiProperty({
    description: 'The service line id of the reponse.',
    example: 0,
  })
  serviceLineId: number;

  @ApiProperty({
    description: 'The question type of the reponse.',
    example: 'short_text',
  })
  questionType: string;

  @ApiProperty({
    description: 'The question text of the reponse.',
    example: 'Question 1 - Short Text.',
  })
  questionText: string;

  @ApiProperty({
    description: 'The sync to athena of the reponse.',
    example: false,
  })
  syncToAthena: boolean;

  @ApiProperty({
    description: 'The order of the reponse.',
    example: 0,
  })
  order: number;

  @ApiProperty({
    description: 'The created time of the reponse.',
    example: '2021-07-08T20:39:08.305Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'The updated time of the reponse.',
    example: '2021-07-08T20:39:08.305Z',
  })
  updatedAt: string;
}

export class CreateServiceLineQuestionResponseDto extends PickType(
  ServiceLineQuestionResponseDto,
  ['serviceLineId', 'responses']
) {}

export class UpdateServiceLineQuestionResponseDto extends PartialType(
  CreateServiceLineQuestionResponseDto
) {
  @ApiProperty({
    description: 'The id of the Service Line question response.',
    example: 0,
  })
  id: number;
}
