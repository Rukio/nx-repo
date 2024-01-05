import { ApiProperty } from '@nestjs/swagger';
import { InsuranceNetworkRequest } from '@*company-data-covered*/consumer-web-types';

export default class SearchInsuranceNetworksDto
  implements InsuranceNetworkRequest
{
  @ApiProperty({
    description: 'IDs of the Insurance Payers',
    example: ['2'],
    required: false,
  })
  payerIds?: string[];

  @ApiProperty({
    description: 'Search by state abbreviations related to Insurance Network',
    example: ['CO', 'LA'],
    required: false,
  })
  stateAbbrs?: string[];

  @ApiProperty({
    description: 'IDs of the Insurance Classifications',
    example: ['0', '159'],
    required: false,
  })
  insuranceClassifications?: string[];

  @ApiProperty({
    description:
      'Search by Insurance Network name/Payer name/address/package ID',
    example: 'Insurance Network name',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description:
      "Represents the sort direction of the Insurance Networks list, may be 'name' or 'update'",
    example: 'update',
    required: false,
  })
  sortField?: string;

  @ApiProperty({
    description:
      "Represents the sort of the Insurance Networks list in ascending or descending order, may be 'asc' or 'desc'",
    example: 'desc',
    required: false,
  })
  sortDirection?: string;

  @ApiProperty({
    description: 'ID of the Billing CIty',
    example: 59,
    required: false,
  })
  billingCityId?: number;

  @ApiProperty({
    description: 'IDs of the Athena Packages.',
    example: ['1'],
    required: false,
  })
  packageIds?: string[];

  @ApiProperty({
    description: 'IDs of insurance plans.',
    example: [1],
    required: false,
  })
  insurancePlanIds?: number[];
}
