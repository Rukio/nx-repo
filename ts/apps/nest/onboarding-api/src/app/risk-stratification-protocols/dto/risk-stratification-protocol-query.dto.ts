import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export default class RiskStratificationProtocolQueryDto {
  @ApiProperty({
    description: 'Date of birth',
    example: '2000-01-01',
  })
  dob: string;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
  })
  gender: string;

  @ApiPropertyOptional({
    description: 'Service line ID',
    example: 10,
  })
  @IsOptional()
  serviceLineId?: string | number;

  @ApiPropertyOptional({
    description: 'Chief complaint',
    example: 'face hurts',
  })
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({
    description: 'Market ID',
    example: 159,
  })
  @IsOptional()
  marketId?: string | number;

  @ApiPropertyOptional({
    description: 'High risk symptom',
    example: null,
  })
  @IsOptional()
  highRisk?: boolean;
}
