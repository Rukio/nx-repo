import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject } from 'class-validator';
import { Pharmacy } from '../interfaces/pharmacy.interface';

export class DefaultPharmacyDto {
  @ApiProperty({
    description: `The default pharmacy.`,
  })
  @IsObject()
  @Type(() => Pharmacy)
  defaultPharmacy: Pharmacy;
}
