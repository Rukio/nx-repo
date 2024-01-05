import { ApiPropertyOptional } from '@nestjs/swagger';

export default class ProviderCallSearchParamsDto {
  @ApiPropertyOptional({
    description: 'screener genesys id',
    example: '3323ds-32d2d32-s32d32',
  })
  genesysId: string;

  @ApiPropertyOptional({
    description: 'screener phone number',
    example: '3035001518',
  })
  mobileNumber: string;
}
