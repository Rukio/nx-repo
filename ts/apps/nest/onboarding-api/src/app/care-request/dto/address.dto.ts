import { ApiProperty } from '@nestjs/swagger';
import { Address } from '@*company-data-covered*/consumer-web-types';

export default class AddressDto implements Address {
  @ApiProperty({
    description: 'Country',
    example: 'USA',
  })
  country: string;

  @ApiProperty({
    description: 'City',
    example: 'Denver',
  })
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'CO',
  })
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '80216-4656',
  })
  zip: string;

  @ApiProperty({
    description: 'Street address line 1',
    example: '6211 E 42nd Ave',
  })
  streetAddress1: string;

  @ApiProperty({
    description: 'Street address line 2',
    example: '',
  })
  streetAddress2: string;

  @ApiProperty({
    description: 'latitude',
    example: '39.7750588',
  })
  latitude: string;

  @ApiProperty({
    description: 'longitude',
    example: '-104.9156156',
  })
  longitude: string;
}
