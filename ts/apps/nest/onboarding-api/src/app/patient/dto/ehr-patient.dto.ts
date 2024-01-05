import { EhrPatient } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import PatientAddressDto from './patient-address.dto';
import PowerOfAttorneyDto from './power-of-attorney.dto';

export default class EhrPatientDto implements EhrPatient {
  @ApiProperty({
    description: 'Patient id',
    example: 123412,
  })
  @IsNumber()
  patientId?: number;

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
  middleName?: string;

  @ApiProperty({
    description: 'Patients EHR(i.e Athena) number',
    example: '345353',
  })
  @IsString()
  ehrPatientId?: string;

  @ApiProperty({
    description: 'Patients Social Security number',
    example: '123456789',
  })
  @IsString()
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
  email?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1944-08-30',
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
  voicemailConsent?: boolean;

  @ApiProperty({
    description: 'Power of attorney',
  })
  @IsOptional()
  powerOfAttorney?: PowerOfAttorneyDto;
}
