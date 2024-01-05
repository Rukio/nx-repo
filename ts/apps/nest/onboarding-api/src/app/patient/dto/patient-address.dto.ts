import { Address } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export default class PatientAddressDto implements Address {
  @ApiProperty({
    description: 'Address id',
    example: 123412,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'City name',
    example: 'Denver',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Country name',
    example: 'USA',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'State name',
    example: 'Colorado',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Street line 1',
    example: 'Lafayette Street 123',
  })
  @IsString()
  streetAddress1: string;

  @ApiProperty({
    description: 'Street line 2',
    example: '',
  })
  @IsString()
  streetAddress2: string;

  @ApiProperty({
    description: 'ZIP code',
    example: '80205',
  })
  @IsString()
  zip: string;
}
