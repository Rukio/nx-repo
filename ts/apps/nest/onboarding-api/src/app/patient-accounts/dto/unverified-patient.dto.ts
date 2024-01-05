import {
  BirthSex,
  GenderIdentityCategory,
  UnverifiedPatient,
} from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export default class UnverifiedPatientDto
  implements Partial<UnverifiedPatient>
{
  @ApiProperty({
    description: 'Athena Id',
    example: '123',
  })
  @IsNumber()
  @IsOptional()
  athenaId?: number;

  @ApiProperty({
    description: 'Date of birth',
    example: '1944-08-30',
  })
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+12312312312',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
  })
  @IsString()
  @IsOptional()
  legalSex?: string;

  @ApiProperty({
    description: 'Birth sex',
    example: 'male',
  })
  @IsOptional()
  @IsEnum(BirthSex)
  birthSex?: BirthSex;

  @ApiProperty({
    description: 'Gender identity',
    example: GenderIdentityCategory.CATEGORY_MALE,
  })
  @IsOptional()
  @IsEnum(GenderIdentityCategory)
  genderIdentity?: GenderIdentityCategory;

  @ApiProperty({
    description: 'Gender identity details',
    example: 'test',
  })
  @IsOptional()
  @IsString()
  genderIdentityDetails?: string;

  @ApiProperty({
    description: 'Given name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiProperty({
    description: 'Family name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  familyName?: string;

  @ApiProperty({
    description: 'Consistency token',
  })
  @IsOptional()
  consistencyToken?: Uint8Array | string;
}
