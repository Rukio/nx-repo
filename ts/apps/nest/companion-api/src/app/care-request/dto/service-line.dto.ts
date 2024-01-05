import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsString } from 'class-validator';

interface AppointmentType {
  id: string;
  name: string;
}

export class ServiceLine {
  @ApiProperty({
    description: 'The unique identifier of the service line.',
    example: 'unique_id',
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The title given to the type of service line.',
    example: 'acute',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Data for a new patient appointment.',
    example: { id: '1', name: 'new' },
  })
  @IsObject()
  newPatientAppointmentType: AppointmentType;

  @ApiProperty({
    description: 'Data for an existing patient appointment.',
    example: { id: '1', name: 'existing' },
  })
  @IsObject()
  existingPatientAppointmentType: AppointmentType;

  @ApiProperty({
    description: 'Boolean value for if the insurance is out of network.',
    example: true,
  })
  @IsBoolean()
  outOfNetworkInsurance: boolean;

  @ApiProperty({
    description: 'Boolean value for if the checkout workflow is required.',
    example: true,
  })
  @IsBoolean()
  requireCheckout: boolean;

  @ApiProperty({
    description: 'Boolean value for if consent signature is required',
    example: true,
  })
  @IsBoolean()
  requireConsentSignature: boolean;

  @ApiProperty({
    description: 'Boolean value for if medical necessity is required.',
    example: true,
  })
  @IsBoolean()
  requireMedicalNecessity: boolean;
}
