import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum QuestionTag {
  HAS_PCP = 'HAS_PCP',
  HAS_SEEN_PCP_RECENTLY = 'HAS_SEEN_PCP_RECENTLY',
}

export class QuestionAnswerDto {
  @ApiProperty({
    description: `Tag for the question assigned to the question key.`,
    enum: QuestionTag,
    example: QuestionTag.HAS_PCP,
  })
  @IsEnum(QuestionTag)
  questionTag: QuestionTag;

  @ApiProperty({
    description: `The answer to the question assigned to the question key.`,
    example: 'Y',
  })
  @IsString()
  answer: string;
}
