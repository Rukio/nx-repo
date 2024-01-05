import { ApiProperty } from '@nestjs/swagger';
import {
  ServiceLine,
  AppointmentType,
} from '@*company-data-covered*/consumer-web-types';

export default class ServiceLineDto
  implements
    Pick<
      ServiceLine,
      | 'id'
      | 'name'
      | 'outOfNetworkInsurance'
      | 'existingPatientAppointmentType'
      | 'newPatientAppointmentType'
    >
{
  @ApiProperty({
    description: 'Service Line ID',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'Service Line name',
    example: 'Acute Care',
  })
  name: string;

  @ApiProperty({
    description: 'Is out of network insurance',
    example: 'false',
  })
  outOfNetworkInsurance: boolean;

  @ApiProperty({
    description: 'Existing Patient Appointment Type',
  })
  existingPatientAppointmentType: AppointmentType;

  @ApiProperty({
    description: 'New Patient Appointment Type',
  })
  newPatientAppointmentType: AppointmentType;
}
