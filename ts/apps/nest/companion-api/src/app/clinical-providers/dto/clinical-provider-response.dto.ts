import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { ClinicalProvider } from '../interfaces/clinical-provider-response';

export class ClinicalProviderSearchResponseDto {
  @ApiProperty({
    isArray: true,
    type: ClinicalProvider,
  })
  @IsArray()
  clinicalProviders: ClinicalProvider[];
}
