import { CareRequestSymptomsBody } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class CareRequestSymptomsBodyDTO
  implements CareRequestSymptomsBody
{
  @ApiProperty({
    description: 'Care Request ID',
    example: '42',
  })
  careRequestId: number;

  @ApiProperty({
    description: 'List of patient reported symptom aliases',
    example: true,
  })
  symptomAliasesIds: string[];
}
