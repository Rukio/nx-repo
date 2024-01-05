import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class MarketDto {
  @ApiProperty({
    description: 'The unique identifier of the market.',
    example: 'unique_id',
  })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'The name of the market.', example: 'Denver' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The two letter state abbreviation of the market.',
    example: 'CO',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @ApiProperty({ description: 'The short name of the market.', example: 'DEN' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  shortName: string;

  @ApiProperty({
    description: 'The time zone name of the market.',
    example: 'America/Denver',
  })
  @IsString()
  tzName: string;

  @ApiProperty({
    description: 'The time zone short name of the market.',
    example: 'MST',
  })
  @IsString()
  tzShortName: string;
}
