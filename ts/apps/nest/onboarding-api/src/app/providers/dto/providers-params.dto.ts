import { ProviderSearchParam } from '@*company-data-covered*/consumer-web-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export default class ProvidersQueryDto implements ProviderSearchParam {
  @ApiPropertyOptional({
    description: 'License state',
    example: 'MA',
  })
  secondaryScreeningLicenseState: string;

  @ApiPropertyOptional({
    description: 'Get providers for online users',
    example: true,
  })
  onlyOnline: boolean;

  @ApiPropertyOptional({
    description: 'Get providers not on shifts',
    example: false,
  })
  notOnShift: boolean;
}
