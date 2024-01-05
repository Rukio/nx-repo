import { PatientSearchParam } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class PatientSearchParamDto implements PatientSearchParam {
  @ApiProperty({
    description: 'Patient first name parameter',
    example: 'John',
    required: false,
  })
  firstName: string;

  @ApiProperty({
    description: 'Patient last name parameter',
    example: 'Doe',
    required: false,
  })
  lastName: string;

  @ApiProperty({
    description: 'zipcode of patient',
    example: '80205',
    required: false,
  })
  zipCode?: string;

  @ApiProperty({
    description: 'Patient dob parameter',
    example: '15-05-1994',
    required: false,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Limit parameter',
    example: 10,
    required: false,
  })
  limit: number;

  @ApiProperty({
    description: 'Offset parameter',
    example: 0,
    required: false,
  })
  offset: number;
}
