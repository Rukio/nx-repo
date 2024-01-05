import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CareRequestStateMetadata {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'ETA for Dispatch team to arrive',
    example: '2021-10-15T22:52:20.402-06:00',
  })
  eta?: string;

  [key: string]: unknown;
}
