import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class InsuranceImageUploadDto {
  @ApiPropertyOptional({
    type: 'file',
    format: 'binary',
    description: `The base64-formatted image file of the front of the insurance card. Must be provided if cardBack is not provided.`,
  })
  @IsString()
  @IsOptional()
  cardFront?: string;

  @ApiPropertyOptional({
    type: 'file',
    format: 'binary',
    description: `The base64-formatted image file of the back of the insurance card. Must be provided if cardFront is not provided.`,
  })
  @IsString()
  @IsOptional()
  cardBack?: string;
}
