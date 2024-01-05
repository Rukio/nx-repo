import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ClinicalProviderSearchParams {
  @ApiPropertyOptional({
    description:
      'First name of the clinical provider. Required if lastName is provided.',
    example: 'John',
  })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description:
      'Last name of the clinical provider. Required if firstName is provided.',
    example: 'Smith',
  })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'The name of clinical provider entity, such as a pharmacy.',
    example: 'King Soopers Pharmacy',
  })
  @IsOptional()
  entityName?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the clinical provider.',
    example: '3035551515',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'The zip code of the clinical provider on file.',
    example: '80123',
  })
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional({
    description:
      'The distance in miles from the specified ZIP code that a provider can be located to be included in the results.',
    example: 25,
  })
  @IsOptional()
  distanceMiles?: number;

  @ApiPropertyOptional({
    description:
      'The number of results that will be returned in the search. If the search has more results, the offset parameter can be used for paging.',
    example: 100,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: `The numeric offset in the search results to return. Example: a search with
      250 results, a limit of 100, and an offset of 99, will return result indexes 100-199.`,
    example: 0,
  })
  @IsOptional()
  offset?: number;
}
