import { WebRequestPatient } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export default class WebRequestPatientDto implements WebRequestPatient {
  @ApiProperty({
    description: 'Patient id',
    example: 123412,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'John',
  })
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Patient last name parameter',
    example: 'Doe',
  })
  @IsString()
  lastName?: string;

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
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'f',
  })
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'Patient createdAt date',
    example: '2021-02-05T17:30:52.236Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Patient updatedAt date',
    example: '2021-02-05T17:30:52.236Z',
  })
  @IsString()
  updatedAt: string;

  @ApiProperty({
    description: 'The id of the care request',
    example: 613979,
  })
  @IsNumber()
  careRequestId?: number;
}
