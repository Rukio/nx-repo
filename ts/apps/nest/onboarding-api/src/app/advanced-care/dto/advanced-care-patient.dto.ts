import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AdvancedCarePatient } from '@*company-data-covered*/consumer-web-types';

export default class AdvancedCarePatientDto implements AdvancedCarePatient {
  @ApiProperty({
    description: 'The id of the advanced care patient',
    example: '60',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The first name of the advanced care patient',
    example: 'Aide',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The middle name of the advanced care patient',
    example: 'Wehner',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    description: 'The last name of the advanced care patient',
    example: 'Gleason',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'The date of birth of the advanced care patient',
    example: '2012-04-29',
  })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'The gender of the advanced care patient',
    example: '1',
  })
  @IsString()
  sex: string;

  @ApiProperty({
    description: 'The phone number of the advanced care patient',
    example: '303-500-1518',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description:
      'The athena medical record number of the advanced care patient',
    example: '3239',
  })
  @IsOptional()
  @IsString()
  athenaMedicalRecordNumber?: string;

  @ApiProperty({
    description: 'The name of the payer for the advanced care patient',
    example: 'Innovage',
  })
  @IsOptional()
  @IsString()
  payer?: string;

  @ApiProperty({
    description: 'The street address of the advanced care patient',
    example: '4195 Carolann Village',
  })
  @IsOptional()
  @IsString()
  addressStreet?: string;

  @ApiProperty({
    description: 'The city of the advanced care patient',
    example: 'Reubenshire',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'The state of the advanced care patient',
    example: 'New Mexico',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'The zipcode of the advanced care patient',
    example: '77294',
  })
  @IsOptional()
  @IsString()
  zipcode?: string;

  @ApiProperty({
    description: 'The athena id of the advanced care patient',
    example: '3239',
  })
  @IsOptional()
  @IsString()
  athenaId: string;
}
