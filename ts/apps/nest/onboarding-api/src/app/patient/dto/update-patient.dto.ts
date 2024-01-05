import {
  BirthSex,
  GenderIdentityCategory,
  Patient,
} from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import PatientAddressDto from './patient-address.dto';
import PatientGuarantorDto from './patient-guarantor.dto';
import PatientSafetyFlagDto from './patient-safety-flag.dto';
import PowerOfAttorneyDto from './power-of-attorney.dto';

export default class UpdatePatientDto implements Patient {
  @ApiProperty({
    description: 'Patient id',
    example: 124,
  })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Patient middle name parameter',
    example: 'Michael',
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({
    description: 'Patient suffix parameter',
    example: 'Mr',
  })
  @IsString()
  @IsOptional()
  suffix?: string;

  @ApiProperty({
    description: 'Patients Social Security number',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  ssn?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+12312312312',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'test@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1944-08-30',
  })
  @IsString()
  @IsOptional()
  dateOfBirth?: Date | string;

  @ApiProperty({
    description: 'Gender',
    example: 'f',
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'Voicemail Consent',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  voicemailConsent?: boolean;

  @ApiProperty({
    description: 'Patients EHR(i.e Athena) number',
    example: '345353',
  })
  @IsString()
  @IsOptional()
  ehrPatientId?: string;

  @ApiProperty({
    description: 'Patients address',
    type: PatientAddressDto,
  })
  @IsOptional()
  address?: PatientAddressDto;

  @ApiProperty({
    description: 'Power of attorney',
  })
  @IsOptional()
  powerOfAttorney?: PowerOfAttorneyDto;

  @ApiProperty({
    description: 'Guarantor info',
  })
  @IsOptional()
  guarantor?: PatientGuarantorDto;

  @ApiProperty({
    description: 'Patient Safety flag',
  })
  @IsOptional()
  patientSafetyFlag?: PatientSafetyFlagDto;

  @ApiProperty({
    description: 'Billing city id',
  })
  @IsOptional()
  billingCityId?: number;

  @ApiProperty({
    description: 'Gender identity',
  })
  @IsOptional()
  @IsEnum(GenderIdentityCategory)
  genderIdentity?: GenderIdentityCategory;

  @ApiProperty({
    description: 'Birth sex',
  })
  @IsOptional()
  @IsEnum(BirthSex)
  birthSex?: BirthSex;

  @ApiProperty({
    description: 'Patient consistency token',
  })
  @IsOptional()
  consistencyToken?: Uint8Array;
}
