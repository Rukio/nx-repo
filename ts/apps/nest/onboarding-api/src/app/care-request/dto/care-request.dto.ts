import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CareRequest,
  CareRequestType,
  RequestStatus,
  RequestedServiceLine,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import PatientDto from './patient.dto';
import AddressDto from './address.dto';
import RequesterDto from './requester.dto';
import AppointmentSlotDto from './appointment-slot.dto';
import ServiceLineDto from './service-line.dto';
import EtaRangeDto from './eta-range.dto';
import ShiftTeamDto from '../../shift-teams/dto/shift-team.dto';
import StatusDto from './status.dto';
import CareRequestMarketDto from '../../market/dto/market.dto';
import PatientPreferredEtaDto from './patient-preferred-eta.dto';
import PartnerReferralDto from './partner-referral.dto';
import {
  IsNumber,
  IsOptional,
  IsObject,
  IsString,
  IsBoolean,
} from 'class-validator';

export default class CareRequestDto implements Partial<CareRequest> {
  @ApiPropertyOptional({
    description: 'Id of the care request',
    example: 123,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Id of the requester/caller',
    example: 3422,
  })
  @IsNumber()
  requesterId: number;

  @ApiPropertyOptional({
    description: 'request type of care',
    example: CareRequestType.phone,
  })
  @IsObject()
  @IsOptional()
  requestType?: CareRequestType;

  @ApiPropertyOptional({
    description: 'The place of service of the care request.',
    example: 'Home',
  })
  @IsString()
  @IsOptional()
  placeOfService?: string;

  @ApiProperty({
    description: 'Id of the market',
    example: 159,
  })
  @IsNumber()
  marketId: number;

  @ApiProperty({
    description: 'Status of the request',
    example: 'requested',
  })
  @IsObject()
  requestStatus: RequestStatus;

  @ApiProperty({
    description: 'service line id of the care request',
    example: 7,
  })
  @IsNumber()
  serviceLineId: number;

  @ApiProperty({
    description: 'channel item id of the care request',
    example: 9974,
  })
  @IsNumber()
  channelItemId: number;

  @ApiPropertyOptional({
    description: 'the field specifying that screening can be bypassed',
    example: false,
  })
  @IsBoolean()
  bypassScreeningProtocol?: boolean;

  @ApiPropertyOptional({
    description: 'the field specifying the origin phone of the channel',
  })
  @IsString()
  @IsOptional()
  channelItemSelectedWithOriginPhone?: string;

  @ApiPropertyOptional({
    description: 'billing city id of the care request',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  billingCityId?: number;

  @ApiPropertyOptional({
    description: 'statsig care request id',
    example: '641b9e71-3209-4f9a-a015-fb7398389042',
  })
  @IsString()
  @IsOptional()
  statsigCareRequestId?: string;

  @ApiPropertyOptional({
    description: 'billing status of the care request',
    example: 'incomplete',
  })
  @IsString()
  @IsOptional()
  billingStatus?: string;

  @ApiProperty({
    description: 'chief complaint of care',
    example: { symptoms: 'cough' },
    type: 'object',
  })
  @IsObject()
  complaint: { symptoms: string };

  @ApiProperty({
    description: 'Requester information',
  })
  @IsObject()
  requester: RequesterDto;

  @ApiProperty({
    description: 'Address information',
  })
  @IsObject()
  address: AddressDto;

  @ApiProperty({
    description: 'Patient information',
  })
  @IsObject()
  patient: PatientDto;

  @ApiPropertyOptional({
    description: 'Patient information',
    example: {
      id: 1,
      name: 'Testing',
    },
  })
  @IsObject()
  @IsOptional()
  channelItem?: Partial<ChannelItem>;

  @ApiPropertyOptional({
    description: 'Care Request Appointment details',
  })
  @IsObject()
  @IsOptional()
  appointmentSlot?: AppointmentSlotDto;

  @ApiPropertyOptional({
    description: 'Care Request Service Line',
  })
  @IsObject()
  @IsOptional()
  serviceLine?: ServiceLineDto;

  @ApiPropertyOptional({
    description: 'Care Request Eta Ranges',
    type: EtaRangeDto,
    isArray: true,
  })
  @IsObject()
  @IsOptional()
  etaRanges?: EtaRangeDto[];

  @ApiPropertyOptional({
    description: 'Care Request Shift Team',
    type: ShiftTeamDto,
  })
  @IsObject()
  @IsOptional()
  shiftTeam?: ShiftTeamDto;

  @ApiPropertyOptional({
    description: 'Care Request Shift Team id',
    example: 136361,
  })
  @IsNumber()
  @IsOptional()
  shiftTeamId?: number;

  @ApiPropertyOptional({
    description: 'Care Request status',
    type: StatusDto,
  })
  @IsObject()
  @IsOptional()
  activeStatus?: StatusDto;

  @ApiProperty({
    description: 'Care Request assignment date',
    example: '2022-03-28',
  })
  assignmentDate: string;

  @ApiProperty({
    description: 'Care Request assignment status',
    example: 'confirmed_team',
  })
  @IsString()
  assignmentStatus: string;

  @ApiPropertyOptional({
    description: 'Care Request market',
  })
  @IsObject()
  @IsOptional()
  market?: CareRequestMarketDto;

  @ApiPropertyOptional({
    description: 'Service line requested',
    example: RequestedServiceLine.acuteCare,
  })
  @IsObject()
  @IsOptional()
  requestedServiceLine?: RequestedServiceLine;

  @ApiPropertyOptional({
    description: 'preferred eta for patient visit',
  })
  @IsObject()
  @IsOptional()
  patientPreferredEta?: PatientPreferredEtaDto;

  @ApiPropertyOptional({
    description: 'Partner Referral of CR',
  })
  @IsObject()
  @IsOptional()
  partnerReferral?: PartnerReferralDto;

  @ApiPropertyOptional({
    description: 'priority note of the care request',
    example: 'Acuity prioritized care request',
  })
  @IsString()
  @IsOptional()
  priorityNote?: string;
}
