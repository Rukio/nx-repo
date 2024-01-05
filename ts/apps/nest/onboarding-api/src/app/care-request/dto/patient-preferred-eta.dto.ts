import { ApiProperty } from '@nestjs/swagger';
import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';

export default class PatientPreferredEtaDto implements PatientPreferredEta {
  @ApiProperty({
    description: 'start time of preferred visit',
    example: '2015-01-01T16:00:00.000Z',
  })
  patientPreferredEtaStart: Date | string;

  @ApiProperty({
    description: 'end time of preferred visit',
    example: '2015-01-01T18:00:00.000Z',
  })
  patientPreferredEtaEnd: Date | string;
}
