import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortDirection, SortField } from '@*company-data-covered*/consumer-web-types';

export default class GetInsurancePayersDto {
  @ApiProperty({
    description: 'Search by state abbreviations related to Insurance Network',
    example: ['CO', 'LA'],
  })
  stateAbbrs: string[];

  @ApiPropertyOptional({
    description: 'Name of Payer',
    example: 'John',
    required: false,
  })
  payerName?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 0,
    required: false,
  })
  sortField: SortField;

  @ApiProperty({
    description: 'Sort direction',
    example: 0,
    required: false,
  })
  sortDirection: SortDirection;
}
