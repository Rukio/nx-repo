import { ProviderSearchBody } from '@*company-data-covered*/consumer-web-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export default class ProvidersBodyDto implements ProviderSearchBody {
  @ApiPropertyOptional({
    description: 'License state',
    example: 'CO',
  })
  secondaryScreeningLicenseState: string;

  @ApiPropertyOptional({
    description: 'Get providers with name',
    example: 'mary',
  })
  name: string;
}
