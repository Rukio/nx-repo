import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentType,
  ServiceLine,
  InsurancePlanServiceLine,
  ProtocolRequirement,
} from '@*company-data-covered*/consumer-web-types';

export default class ServiceLineDto implements ServiceLine {
  @ApiProperty({
    description: 'The id of the Service Line.',
    example: 'unique_id',
  })
  id: number;

  @ApiProperty({
    description: 'The name of the Service Line.',
    example: 'Acute Care',
  })
  name: string;

  @ApiProperty({
    description: 'The new patient appointment type of the Service Line.',
  })
  newPatientAppointmentType: AppointmentType;

  @ApiProperty({
    description: 'The existing patient appointment type of the Service Line.',
  })
  existingPatientAppointmentType: AppointmentType;

  @ApiProperty({
    description: 'The created time of the Service Line.',
    example: '2021-07-08T20:39:08.305Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'The updated time of the Service Line.',
    example: '2021-07-08T20:39:08.305Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'The follow up today of the Service Line.',
    example: false,
  })
  followup2Day: boolean;

  @ApiProperty({
    description: 'The follow up 14 to 30 days of the Service Line.',
    example: false,
  })
  followup_14_30_day: boolean;

  @ApiProperty({
    description: 'Out of network insurance of the Service Line.',
    example: false,
  })
  outOfNetworkInsurance: boolean;

  @ApiProperty({
    description: 'is 911.',
    example: false,
  })
  is911: boolean;

  @ApiProperty({
    example: false,
  })
  requireCheckout: boolean;

  @ApiProperty({
    example: false,
  })
  requireConsentSignature: boolean;

  @ApiProperty({
    example: false,
  })
  requireMedicalNecessity: boolean;

  @ApiProperty({
    description: 'The shift type id of the Service Line.',
    example: 1,
  })
  shiftTypeId: number;

  @ApiProperty({
    description: 'The parent id of the Service Line.',
  })
  parentId: number;

  @ApiProperty({
    example: false,
  })
  upgradeableWithScreening: boolean;

  @ApiProperty({
    example: false,
  })
  default: boolean;

  @ApiProperty({
    description: 'The questions of the Service Line.',
    isArray: true,
  })
  serviceLineQuestions: [];

  @ApiProperty({
    description: 'The insurance plan of the Service Line.',
    isArray: true,
  })
  insurancePlanServiceLines: InsurancePlanServiceLine[];

  @ApiProperty({
    isArray: true,
  })
  subServiceLines: ServiceLine[];

  @ApiProperty({
    isArray: true,
  })
  protocolRequirements: ProtocolRequirement[];
}
