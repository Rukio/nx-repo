import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CurrentStateDto } from '../../care-request/dto/current-state.dto';
import { ProviderDto } from '../../care-request/dto/provider.dto';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { ProviderPosition } from '../../dashboard/types/dashboard-care-request';
import {
  CompanionTaskStatusDto,
  CompanionTaskWithStatuses,
} from './companion-task-status.dto';

class Location extends PickType(CareRequestDto, [
  'streetAddress1',
  'streetAddress2',
  'city',
  'state',
  'zipcode',
  'longitude',
  'latitude',
]) {}

type CompanionProviderPosition =
  | 'Advanced Practice Provider'
  | 'DispatchHeath Nurse Practitioner'
  | '*company-data-covered* Medical Technician'
  | 'Tech';

export const CompanionProviderPositionMap: Record<
  ProviderPosition,
  CompanionProviderPosition | null
> = {
  'advanced practice provider': 'Advanced Practice Provider',
  'nurse practitioner': 'DispatchHeath Nurse Practitioner',
  emt: '*company-data-covered* Medical Technician',
  'virtual doctor': null,
};

class CompanionProvider extends PickType(ProviderDto, [
  'firstName',
  'providerImageTinyUrl',
]) {
  providerProfileCredentials: string;
  providerProfilePosition: CompanionProviderPosition;
}

export class CompanionInfoDto extends PickType(CareRequestDto, [
  'etaRanges',
  'activeStatus',
  'appointmentSlot',
]) {
  @ApiProperty({
    description: `The ID of the care request.`,
    example: '123456',
  })
  @IsNumber()
  careRequestId: number;

  @ApiProperty({
    description: `The first name of the patient.`,
    example: 'Janet',
  })
  @IsString()
  patientFirstName: string;

  @ApiProperty({
    description: `The last name of the patient.`,
    example: 'Jackson',
  })
  @IsString()
  patientLastName: string;

  @ApiProperty({
    description: `The current state of the care request.`,
    type: CurrentStateDto,
    isArray: true,
  })
  currentStates: CurrentStateDto[];

  @ApiProperty({
    description: `The location info of the care request.`,
    type: Location,
  })
  @IsObject()
  @Type(() => Location)
  location: Location;

  @ApiProperty({
    description: `The providers assigned to the care request.`,
    type: CompanionProvider,
    isArray: true,
  })
  @IsArray()
  providers: CompanionProvider[];

  @ApiProperty({
    description: `The task statuses associated with the companion link.`,
    type: CompanionTaskStatusDto,
    isArray: true,
  })
  @IsArray()
  checkInTaskStatuses: CompanionTaskStatusDto[];

  @ApiProperty({
    description: 'The care request market is part of LV1 launch',
    example: true,
  })
  @IsBoolean()
  isLV1: boolean;

  constructor(init?: Partial<CompanionInfoDto>) {
    super();
    Object.assign(this, init);
  }

  static fromCareRequest(
    careRequest: CareRequestDto,
    tasks: CompanionTaskWithStatuses[] = [],
    isLV1 = false
  ): CompanionInfoDto {
    const requiredCareRequestStates: CareRequestStatusText[] = [
      CareRequestStatusText.Requested,
      CareRequestStatusText.Accepted,
      CareRequestStatusText.Scheduled,
      CareRequestStatusText.OnRoute,
      CareRequestStatusText.OnScene,
      CareRequestStatusText.Complete,
    ];

    return new CompanionInfoDto({
      careRequestId: careRequest.id,
      patientFirstName: careRequest.patient?.firstName ?? '',
      patientLastName: careRequest.patient?.lastName ?? '',
      currentStates: careRequest.currentState
        .filter((state) => requiredCareRequestStates.includes(state.name))
        .map((state) => {
          state.metadata = { eta: state.metadata?.eta };

          return state;
        }),
      appointmentSlot: careRequest.appointmentSlot,
      activeStatus: careRequest.activeStatus,
      etaRanges: careRequest.etaRanges,
      providers: careRequest.providers
        .filter(
          (provider) => provider.providerProfilePosition !== 'virtual doctor'
        )
        .map<CompanionProvider>((provider) => {
          return {
            firstName: provider.firstName,
            providerImageTinyUrl: provider.providerImageTinyUrl,
            providerProfileCredentials: provider.providerProfileCredentials,
            providerProfilePosition:
              CompanionProviderPositionMap[provider.providerProfilePosition] ??
              'Tech',
          };
        }),
      location: {
        longitude: careRequest.longitude,
        latitude: careRequest.latitude,
        streetAddress1: careRequest.streetAddress1,
        streetAddress2: careRequest.streetAddress2,
        city: careRequest.city,
        state: careRequest.state,
        zipcode: careRequest.zipcode,
      },
      checkInTaskStatuses: tasks.map((task) =>
        CompanionTaskStatusDto.fromCompanionTask(task)
      ),
      isLV1: isLV1,
    });
  }
}
