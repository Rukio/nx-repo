import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskQuestion } from '@*company-data-covered*/consumer-web-types';

class Question implements RiskQuestion {
  @ApiProperty({
    description: 'weight of yes',
    example: 5,
  })
  weightYes: number;

  @ApiProperty({
    description: 'weight of yes',
    example: 0,
  })
  weightNo: number;

  @ApiPropertyOptional({
    description: 'whether the question is required',
    example: false,
  })
  required: boolean;

  @ApiPropertyOptional({
    description: 'The Protocol id',
    example: 1234,
  })
  protocolId: number;

  @ApiProperty({
    description: 'The question order',
    example: 12,
  })
  order: number;

  @ApiProperty({
    description: 'The question',
    example: 'Is there any new confusion?',
  })
  name: string;

  @ApiProperty({
    description: 'The question id',
    example: 4,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'The question has notes',
    example: false,
  })
  hasNotes: boolean;

  @ApiPropertyOptional({
    example: false,
  })
  allowNa: boolean;

  @ApiProperty({
    description: 'The answer to the question',
    example: 'Yes',
  })
  answer: string;
}

export default class ResponsesDto {
  @ApiProperty({
    isArray: true,
  })
  questions: Question[];
}
