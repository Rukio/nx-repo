import {
  ShiftTeamMember,
  ProviderProfileLicense,
} from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';

export default class ShiftTeamMemberDto implements ShiftTeamMember {
  @ApiProperty({
    description: 'Shift Team member ID',
    example: 11595,
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: 'Shift Team member first name',
    example: 'Jennifer',
  })
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Shift Team member last name',
    example: 'Allison',
  })
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Shift Team member mobile number',
    example: null,
  })
  @IsString()
  mobileNumber?: string;

  @ApiProperty({
    description: 'Shift Team member tiny image URL',
    example:
      'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/260/tiny_Jenn_Allison_DEN_NP_5x5.jpg',
  })
  @IsString()
  providerImageTinyUrl?: string;

  @ApiProperty({
    description: 'Shift Team member profile position',
    example: 'advanced practice provider',
  })
  @IsString()
  providerProfilePosition?: string;

  @ApiProperty({
    description: 'Shift Team member profile licenses',
    example: [
      {
        id: 77,
        state: 'CO',
        expiration: '2022-09-01',
        licenseNumber: '10089',
      },
      {
        id: 3044,
        state: 'FL',
        expiration: '2023-09-01',
        licenseNumber: '**RN.0191433 (multi-state CO)',
      },
    ],
  })
  @IsObject()
  providerProfileLicenses?: ProviderProfileLicense[];

  @ApiProperty({
    description: 'Shift Team member profile credentials',
    example: 'NP',
  })
  @IsString()
  providerProfileCredentials?: string;

  @ApiProperty({
    description: 'Shift Team member states of secondary screenings',
    example: null,
  })
  @IsArray()
  secondaryScreeningStates?: string[];
}
