import { InsuranceClassification } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class InsuranceClassificationDto
  implements InsuranceClassification
{
  @ApiProperty({
    description: 'The id of the insurance Classification',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the insurance Classification',
    example: 'Commercial',
  })
  name: string;
}
