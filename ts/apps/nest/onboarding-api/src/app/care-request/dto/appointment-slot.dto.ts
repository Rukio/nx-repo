import { ApiProperty } from '@nestjs/swagger';
import { AppointmentSlot } from '@*company-data-covered*/consumer-web-types';

export default class AppointmentSlotDto implements AppointmentSlot {
  @ApiProperty({
    description: 'slot ID to update/create',
    example: '234',
  })
  id?: number;

  @ApiProperty({
    description: 'Appointment Start Time',
    example: '2022-02-19T09:00:00+02:00',
  })
  startTime?: string | Date;

  @ApiProperty({
    description: 'Destroy slot attribute',
    example: '1',
  })
  destroy?: number | boolean;
}
