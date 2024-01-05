import { Patient } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import PatientAddressDto from './patient-address.dto';
import PatientGuarantorDto from './patient-guarantor.dto';
import PatientSafetyFlagDto from './patient-safety-flag.dto';
import PowerOfAttorneyDto from './power-of-attorney.dto';

export default class CreatePatientDto implements Patient {
  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'John',
  })
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'Doe',
  })
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Patient middle name parameter',
    example: 'Michael',
  })
  @IsString()
  @IsOptional()
  middleName?: string;

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
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'test@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description:
      'Date of birth of patient in format YYYY-MM-DD for correct transformation into gRPC Date object',
    example: '30-08-1944',
  })
  @IsString()
  dateOfBirth?: Date | string;

  @ApiProperty({
    description: 'Gender',
    example: 'f',
  })
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'Patients address',
    type: PatientAddressDto,
  })
  address?: PatientAddressDto;

  @ApiProperty({
    description: 'Voicemail Consent',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  voicemailConsent?: boolean;

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
}
