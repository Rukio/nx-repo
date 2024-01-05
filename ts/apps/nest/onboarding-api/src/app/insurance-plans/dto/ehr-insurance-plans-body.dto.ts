import { EhrInsurancePlan } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class EhrInsurancePlanBodyDto implements EhrInsurancePlan {
  @ApiProperty({
    description: 'the list of affiliations the insurance package has',
    example: ['Family Planning', 'QMB'],
    isArray: true,
  })
  affiliations: string[];

  @ApiProperty({
    description: 'the insurance package name',
    example: 'Testing',
  })
  planName: string;

  @ApiProperty({
    description: 'the insurance package id',
    example: '1234567',
  })
  packageId: string;

  @ApiProperty({
    description: 'the list of address where insurance package is served',
    example: [
      'PO BOX 12312  Johnson JA 46206-6178',
      'PO BOX 123465512  James SA 02044-1212',
    ],
    isArray: true,
  })
  addressList: string[];
}
