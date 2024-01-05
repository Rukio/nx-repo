import { OssAddress, FacilityType } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export default class AddressDto implements OssAddress {
  @ApiProperty({
    description: 'additional location details',
    example: 'house is at the end of the street',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalDetails?: string;

  @ApiProperty({
    description: 'city',
    example: 'Denver',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'token',
    required: false,
  })
  @IsOptional()
  consistencyToken?: Uint8Array | string;

  @ApiProperty({
    description: 'Account address id',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: 'state',
    example: 'Colorado',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'address line one',
    example: '3827 Lafayette Street',
  })
  @IsString()
  streetAddress1: string;

  @ApiProperty({
    description: 'address line two',
  })
  @IsOptional()
  @IsString()
  streetAddress2: string;

  @ApiProperty({
    description: 'zipcode',
    example: '80205',
  })
  @IsString()
  zip: string;

  @ApiProperty({
    description: 'value from suggested address',
    example: 'de22bed8-7f52-44cb-8526-faceac57150a',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  googleValidationResponseId?: string;

  @ApiProperty({
    description: 'Facility type',
    example: FacilityType.FACILITY_TYPE_HOME,
  })
  @IsEnum(FacilityType)
  facilityType: FacilityType;
}
