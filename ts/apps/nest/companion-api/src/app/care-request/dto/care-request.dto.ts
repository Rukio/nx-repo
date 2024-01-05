import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsDate,
  IsDefined,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  IsEnum,
  ValidateNested,
  IsObject,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ProviderDto } from './provider.dto';
import { CurrentStateDto } from './current-state.dto';
import { Caller } from '../../dashboard/types/caller';
import { DashboardCareRequest } from '../../dashboard/types/dashboard-care-request';
import { EtaRangeDto } from './eta-range.dto';
import { AppointmentSlotDto } from './appointment-slot.dto';
import { ActiveStatusDto } from './active-status.dto';
import { Gender } from '../enums/care-request-patient-gender.enum';
import { ServiceLine } from './service-line.dto';
import { RequestType } from '../types/request-type';
import { MarketDto } from './market.dto';
import { Type } from 'class-transformer';

/** The regular expression used to validate date of birth strings. */
const dobPattern = '[0-9]{2}/[0-9]{2}/[0-9]{4}';

/** Represents a Companion Patient. */
export class PatientDto {
  @ApiProperty({
    description: `The patient's unique identifier.`,
    example: 'unique_id',
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: `The patient's first (given) name.`,
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: `The patient's last (family) name.`,
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: `The patient's mobile number.`,
    example: '3035555555',
  })
  @IsString()
  @IsOptional()
  mobileNumber: string | null;

  @ApiProperty({
    description: `The patient's consent to voicemail communications.`,
    example: true,
  })
  @IsBoolean()
  voicemailConsent: boolean;

  @ApiPropertyOptional({
    description: `The patient's email address.`,
    example: 'patient@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: `The patient's date of birth in MM/DD/YYYY format.`,
    pattern: dobPattern,
    example: '03/16/1995',
  })
  @Matches(dobPattern)
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    description: `The patient's gender as assigned at birth.`,
    enum: ['male', 'female', 'Male', 'Female'],
  })
  @IsIn(['male', 'female', 'Male', 'Female'])
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({
    description: `The EHR unique identifier.`,
  })
  @IsString()
  @IsOptional()
  ehrId?: string;
}

/** The information necessary to create a patient in the application. */
export class CreatePatientDto extends OmitType(PatientDto, ['id', 'ehrId']) {}

export class EtaRangesDto {
  @ApiProperty({
    description: `The start timestamp of the care team's ETA range.`,
    example: `'2021-07-08T18:39:08.305Z'`,
  })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    description: `The end timestamp of the care team's ETA range.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsDateString()
  endsAt: string;
}

export class CareRequestDto {
  @ApiProperty({
    description: 'The unique identifier of the care request.',
    example: 'unique_id',
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The primary complaint and reason for requesting care.',
    example: 'head pain',
  })
  @IsString()
  chiefComplaint: string;

  @ApiProperty({
    description:
      'The first line of the street address for the care request location.',
    example: '3827 Lafayette St ',
  })
  @IsString()
  streetAddress1: string;

  @ApiProperty({
    description:
      'The second line of the street address for the care request location.',
    example: 'Unit 206',
  })
  @IsString()
  streetAddress2: string;

  @ApiProperty({
    description: 'The city for the care request location.',
    example: 'Denver',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'The state for the care request location.',
    example: 'CO',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'The ZIP code for the care request location.',
    example: '80123',
  })
  @IsString()
  zipcode: string;

  @ApiProperty({
    description: 'The device-type/origin of the care request.',
    enum: RequestType,
    example: RequestType.PHONE,
  })
  @IsEnum(RequestType)
  requestType: RequestType;

  @ApiProperty({
    description: 'The unique identifier of the care request patient.',
    example: 'unique_id',
  })
  @IsNumber()
  patientId: number;

  @ApiProperty({
    description: 'The phone number associated with the care request.',
    example: '3035555555',
  })
  @IsString()
  @IsOptional()
  phoneNumber: string | null;

  @ApiProperty({
    description: 'The patient associated with the care request.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PatientDto)
  @IsOptional()
  patient: PatientDto | null;

  @ApiProperty({
    description: `The latitude of the care request location.`,
    example: `39.82472893982204`,
  })
  @IsNumber()
  latitude: number; // TODO: add latitude validate pipe

  @ApiProperty({
    description: `The longitude of the care request location.`,
    example: `-105.12789233256967`,
  })
  @IsNumber()
  longitude: number; // TODO: add longitude validate pipe

  @ApiProperty({ description: `Information of the ETA of the provider team.` })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtaRangeDto)
  etaRanges: EtaRangeDto[];

  @ApiProperty({
    description: `Information about the provider team.`,
    type: ProviderDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderDto)
  providers: ProviderDto[];

  @ApiProperty({
    description: `The timestamp of when care request is created`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsDate()
  createdAt: Date; // TODO: add date validate pipe

  @ApiPropertyOptional({
    description: `Information about appointment slot if scheduled appointment`,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentSlotDto)
  appointmentSlot?: AppointmentSlotDto;

  @ApiPropertyOptional({
    description: `The date for which a care request is assigned.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsDateString()
  @IsOptional()
  assignmentDate?: string;

  @ApiProperty({
    description: `Information about the current state of the CR.`,
    type: CurrentStateDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentStateDto)
  currentState: CurrentStateDto[];

  @ApiProperty({
    description: `Information about the caller for onboarding the care request.`,
    type: Caller,
  })
  @IsDefined()
  caller: DashboardCareRequest['caller'];

  @ApiProperty({
    description: `Information about active status of the care request.`,
    type: ActiveStatusDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ActiveStatusDto)
  activeStatus: ActiveStatusDto;

  @ApiProperty({
    description: `The generated ID for use with Statsig analytics and user identification.`,
    example: '56925e29-5cd6-442d-ad69-f227dcf5f3c4',
  })
  @IsDefined()
  statsigCareRequestId: string;

  @ApiPropertyOptional({
    description: 'The service line associated with the care request.',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceLine)
  serviceLine?: ServiceLine;

  @ApiProperty({
    description: 'The care request market',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => MarketDto)
  market: MarketDto;
}
