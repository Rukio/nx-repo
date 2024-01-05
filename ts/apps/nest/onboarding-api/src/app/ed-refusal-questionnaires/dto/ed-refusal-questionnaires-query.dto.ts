import { ApiProperty } from '@nestjs/swagger';

export default class EdRefusalQuestionnairesQueryDto {
  @ApiProperty({
    description: 'The care request id',
    example: 1,
  })
  careRequestId: number | string;
}
