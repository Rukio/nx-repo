import { CompanionInfoDto } from '../dto/companion-info.dto';
import * as faker from 'faker';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { buildMockActiveStatus } from '../../care-request/mocks/care-request.repository.mock';
import { CompanionTaskWithStatuses } from '../dto/companion-task-status.dto';

export const buildMockCompanionInfo = (
  init: Partial<CompanionInfoDto> = {}
): CompanionInfoDto => ({
  careRequestId: faker.datatype.number(),
  patientFirstName: faker.name.firstName(),
  patientLastName: faker.name.lastName(),
  appointmentSlot: undefined,
  currentStates: [],
  activeStatus: buildMockActiveStatus(),
  etaRanges: [],
  providers: [],
  location: {
    latitude: parseFloat(faker.address.latitude()),
    longitude: parseFloat(faker.address.longitude()),
    streetAddress1: faker.address.streetAddress(),
    streetAddress2: '',
    city: faker.address.city(),
    state: faker.address.stateAbbr(),
    zipcode: faker.address.zipCode(),
  },
  checkInTaskStatuses: [],
  isLV1: false,
  ...init,
});

export const buildMockCompanionInfoFromCareRequest = (
  careRequest: CareRequestDto,
  tasks: CompanionTaskWithStatuses[] = [],
  isLV1 = false
) => CompanionInfoDto.fromCareRequest(careRequest, tasks, isLV1);
