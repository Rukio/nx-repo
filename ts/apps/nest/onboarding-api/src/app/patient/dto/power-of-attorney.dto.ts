import { PowerOfAttorney } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export default class PowerOfAttorneyDto implements PowerOfAttorney {
  @ApiProperty({
    description: 'Patient Power Of Attorney id',
    example: 643,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Patient id',
    example: 6545,
  })
  @IsNumber()
  @IsOptional()
  patientId?: number;

  @ApiProperty({
    description: 'Power of attorney name',
    example: 'Zac Efron',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Power of attorney phone',
    example: '3035001518',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Power of attorney phone details',
  })
  @IsOptional()
  phoneNumber?: {
    mobile: boolean;
  };

  @ApiProperty({
    description: 'Power of attorney relation to patient',
    example: 'family:child',
  })
  @IsString()
  @IsOptional()
  relationship?: string;
}
