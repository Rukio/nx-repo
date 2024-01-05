import { PatientSafetyFlag } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export default class PatientSafetyFlagDto implements PatientSafetyFlag {
  @ApiProperty({
    description: 'id',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Flag Type',
    example: 'permanent',
  })
  @IsString()
  flagType?: string;

  @ApiProperty({
    description: 'Flag reason',
    example: 'Provider Safety',
  })
  @IsString()
  @IsOptional()
  flagReason?: string;

  @ApiProperty({
    description: 'field to delete Patient Safety reason',
    example: false,
  })
  @IsBoolean()
  destroy?: boolean;
}
