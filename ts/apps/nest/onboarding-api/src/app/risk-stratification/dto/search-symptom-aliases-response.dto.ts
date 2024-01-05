import { ApiProperty } from '@nestjs/swagger';
import {
  SearchSymptomAliasesResponse,
  SymptomAliasesSearchResult,
  Pagination,
} from '@*company-data-covered*/consumer-web-types';
import { IsNumber } from 'class-validator';

export class SymptomAliasSearchResult {
  @ApiProperty({
    description: 'Symptom Alias ID',
    example: '5e5a62d1b63-4668-b2a895a6e-aeb7-424d',
  })
  id: string;
  @ApiProperty({
    description: 'Symptom ID',
    example: 'b2a895a6-4668-424d-aeb7-e5e5a62d1b63',
  })
  symptom_id: string;

  @ApiProperty({ description: 'Symptom Alias Name', example: 'Cold' })
  name: string;

  @ApiProperty({
    description: 'Canonical Symptom Name',
    example: 'Common Cold',
  })
  symptom_name: string;

  @ApiProperty({
    description: 'Legacy Risk Protocol Name',
    example: 'Low Risk',
  })
  legacy_risk_protocol_name: string;
}

export class SearchSymptomAliasesResponsePagination {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNumber()
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  @IsNumber()
  totalPages: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  @IsNumber()
  pageSize: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  @IsNumber()
  totalResults: number;
}

export default class SearchSymptomAliasesResponseDTO
  implements SearchSymptomAliasesResponse
{
  @ApiProperty({
    type: [SymptomAliasSearchResult],
    description: 'List of matching symptom aliases',
    required: true,
  })
  symptoms: SymptomAliasesSearchResult[];

  @ApiProperty({
    type: SearchSymptomAliasesResponsePagination,
    description: 'Pagination details',
    required: true,
  })
  pagination: Pagination;
}
