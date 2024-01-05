import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsNotEmptyObject, ValidateNested } from 'class-validator';
import { ClinicalProviderSearchParams } from '../interfaces/clinical-provider';

export class ClinicalProviderSearchDto {
  @ApiProperty({
    description: 'The clinical provider information to look up in Station.',
  })
  @IsDefined()
  @ValidateNested()
  @IsNotEmptyObject()
  @Type(() => ClinicalProviderSearchParams)
  clinicalProvider: ClinicalProviderSearchParams;
}
