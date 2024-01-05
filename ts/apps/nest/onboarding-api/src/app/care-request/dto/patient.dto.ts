import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '@*company-data-covered*/consumer-web-types';

export default class CareRequestPatientDto implements Patient {
  @ApiProperty({
    description: 'id of existing patient',
    example: '44564',
  })
  id?: number;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Michael',
  })
  middleName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '3035001518',
  })
  phone: string;

  @ApiProperty({
    description: 'Email',
    example: 'test@test.com',
  })
  email: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '2021-11-19T12:55:26.426Z',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
  })
  gender: string;
}
