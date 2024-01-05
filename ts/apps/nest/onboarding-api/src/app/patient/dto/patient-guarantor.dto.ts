import { PatientGuarantor } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';

export default class PatientGuarantorDto implements PatientGuarantor {
  @ApiProperty({
    description: 'Patient Guarantor id',
    example: 124,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Patient id',
    example: 6545,
  })
  @IsNumber()
  @IsOptional()
  patientId?: number;

  @ApiProperty({
    description: 'Guarantor email',
    example: 'example@mail.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Guarantor First Name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Guarantor Last Name',
    example: 'Galt',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Guarantor relation to patient',
    example: 'self',
  })
  @IsString()
  @IsOptional()
  relationToPatient?: string;

  @ApiProperty({
    description: 'Guarantor relationship to patient',
    example: 'self',
  })
  @IsString()
  @IsOptional()
  relationshipToPatient?: string;

  @ApiProperty({
    description: 'Same as care address',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  sameAsCareAddress?: boolean;

  @ApiProperty({
    description: 'Same as care address',
    example: '3035001518',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description:
      'Date of birth of guarantor in format YYYY-MM-DD for correct transformation into gRPC Date object',
    example: '1999-01-01',
  })
  @IsString()
  @IsDate()
  @IsOptional()
  dob?: string | Date;

  @ApiProperty({
    description: 'Security social number',
    example: null,
  })
  @IsString()
  @IsOptional()
  ssn?: string | null;

  @ApiProperty({
    description: 'Billing address city',
    example: 'Denver',
  })
  @IsString()
  @IsOptional()
  billingAddressCity?: string;

  @ApiProperty({
    description: 'Billing address state',
    example: 'CO',
  })
  @IsString()
  @IsOptional()
  billingAddressState?: string;

  @ApiProperty({
    description: 'Billing address street 1',
    example: 'Lafayette',
  })
  @IsString()
  @IsOptional()
  billingAddressStreetAddress1?: string;

  @ApiProperty({
    description: 'Billing address street 2',
    example: '23',
  })
  @IsString()
  @IsOptional()
  billingAddressStreetAddress2?: string;

  @ApiProperty({
    description: 'Billing address zip code',
    example: '80218',
  })
  @IsString()
  @IsOptional()
  billingAddressZipcode?: string;
}
