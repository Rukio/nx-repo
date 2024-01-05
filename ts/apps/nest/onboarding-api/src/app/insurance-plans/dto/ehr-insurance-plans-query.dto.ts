import { EhrInsurancePlanParams } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class EhrInsurancePlanQueryDto
  implements EhrInsurancePlanParams
{
  @ApiProperty({
    description: 'name of the insurance plan',
    example: 'Medic',
  })
  name: string;

  @ApiProperty({
    description: 'The member Id of the insurance holder plan',
    example: 12345,
  })
  memberId: number;

  @ApiProperty({
    description: 'check case policies',
    example: false,
    required: false,
  })
  checkCasePolicies: boolean;
}
