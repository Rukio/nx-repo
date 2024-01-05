import { ApiProperty } from '@nestjs/swagger';
import { SearchSymptomAliasesParams } from '@*company-data-covered*/consumer-web-types';
import { IsNumber } from 'class-validator';

export default class SearchSymptomAliasesQueryDTO
  implements SearchSymptomAliasesParams
{
  @ApiProperty({
    description: 'string used to search symptom aliases',
    example: 'coug',
  })
  searchTerm: string;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  @IsNumber()
  pageSize: number;

  @ApiProperty({ description: 'Requested page', example: 20 })
  @IsNumber()
  page: number;
}
