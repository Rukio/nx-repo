import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActiveStatusDto } from '../dto/active-status.dto';
import * as faker from 'faker';
import { AppointmentSlotDto } from '../dto/appointment-slot.dto';
import { CareRequestDto, PatientDto } from '../dto/care-request.dto';
import { CurrentStateDto } from '../dto/current-state.dto';
import { EtaRangeDto } from '../dto/eta-range.dto';
import { MarketDto } from '../dto/market.dto';
import { ProviderDto } from '../dto/provider.dto';
import { ServiceLine } from '../dto/service-line.dto';
import { CareRequestStatusText } from '../enums/care-request-status.enum';

const basePatientDto: PatientDto = {
  id: faker.datatype.number(),
  firstName: 'First',
  lastName: 'Last',
  mobileNumber: faker.phone.phoneNumber(),
  voicemailConsent: true,
};

const patientOptionalProps: Partial<PatientDto> = {
  email: 'email@example.com',
  dob: '01/01/2000',
  gender: 'Male',
  ehrId: faker.datatype.number().toString(),
};

const etaRange: EtaRangeDto = {
  id: faker.datatype.number(),
  startsAt: '2021-07-08T18:39:08.305Z',
  endsAt: '2021-07-08T18:39:08.305Z',
  careRequestId: faker.datatype.number(),
  careRequestStatusId: faker.datatype.number(),
  createdAt: '2021-07-08T18:39:08.305Z',
  updatedAt: '2021-07-08T18:39:08.305Z',
};

const currentState: CurrentStateDto = {
  id: faker.datatype.number(),
  name: CareRequestStatusText.Requested,
  startedAt: '2021-07-08T20:39:08.315Z',
  createdAt: '2021-07-08T20:39:08.315Z',
  updatedAt: '2021-07-08T20:39:08.315Z',
  statusIndex: 1,
  metadata: {},
};

const baseActiveStatus: ActiveStatusDto = {
  id: faker.datatype.number(),
  name: 'accepted',
  startedAt: '2021-07-08T20:39:08.305Z',
  metadata: {},
  username: 'user',
  commenterName: 'commenter',
};

const activeStatusOptionalProps: Partial<ActiveStatusDto> = {
  userId: 'unknown',
  comment: 'details',
};

const baseAppointmentSlot: Partial<AppointmentSlotDto> = {
  careRequestId: faker.datatype.number(),
};

const appointmentSlotOptionalProps: Partial<AppointmentSlotDto> = {
  id: faker.datatype.number(),
  startTime: '2021-07-08T20:39:08.315Z',
  createdAt: '2021-07-08T20:39:08.305Z',
  updatedAt: '2021-07-08T20:39:08.310Z',
};

const provider: ProviderDto = {
  id: faker.datatype.number().toString(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  providerProfileCredentials: 'doctor',
  providerImageTinyUrl: '',
  providerProfilePosition: 'virtual doctor',
};

const market: MarketDto = {
  id: faker.datatype.number(),
  name: 'Denver',
  state: 'CO',
  shortName: 'DEN',
  tzName: 'America/Denver',
  tzShortName: 'MST',
};

const serviceLine: ServiceLine = {
  id: faker.datatype.number(),
  name: 'acute',
  newPatientAppointmentType: { id: '1', name: 'new' },
  existingPatientAppointmentType: { id: '1', name: 'existing' },
  outOfNetworkInsurance: false,
  requireCheckout: true,
  requireConsentSignature: true,
  requireMedicalNecessity: false,
};

// TODO: update type for CareRequestDto and add to baseCareRequest and careRequestOptionalProps
const baseCareRequest = {
  id: faker.datatype.number(),
  chiefComplaint: 'headache',
  streetAddress1: '00 Denver Zoo',
  streetAddress2: 'Apt 1',
  city: 'Denver',
  state: 'CO',
  zipcode: '80205',
  requestType: 'phone',
  patientId: faker.datatype.number(),
  phoneNumber: faker.phone.phoneNumber(),
  patient: { ...basePatientDto, ...patientOptionalProps },
  latitude: 1,
  longitude: 1,
  etaRanges: [etaRange],
  providers: [provider],
  createdAt: new Date(),
  currentState: [currentState],
  caller: { origin_phone: '', first_name: '', last_name: '' },
  activeStatus: { ...baseActiveStatus, ...activeStatusOptionalProps },
  statsigCareRequestId: 'statsig-id',
  market: market,
};

const careRequestOptionalProps = {
  appointmentSlot: { ...baseAppointmentSlot, ...appointmentSlotOptionalProps },
  assignmentDate: '2021-07-08T20:39:08.305Z',
  serviceLine: serviceLine,
};

describe(`${CareRequestDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = { ...baseCareRequest, ...careRequestOptionalProps };
      const dto = plainToInstance(CareRequestDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const dto = plainToInstance(CareRequestDto, baseCareRequest);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        chiefComplaint: 'headache',
      };
      const dto = plainToInstance(CareRequestDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${ActiveStatusDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        id: faker.datatype.number(),
        name: 'accepted',
        userId: 'unknown',
        startedAt: '2021-07-08T20:39:08.305Z',
        comment: 'details',
        metadata: {},
        username: 'user',
        commenterName: 'commenter',
      };
      const dto = plainToInstance(ActiveStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const body = {
        id: faker.datatype.number(),
        name: 'accepted',
        startedAt: '2021-07-08T20:39:08.305Z',
        metadata: {},
        username: 'user',
        commenterName: 'commenter',
      };
      const dto = plainToInstance(ActiveStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        comment: 'details',
      };
      const dto = plainToInstance(ActiveStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${AppointmentSlotDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        ...baseAppointmentSlot,
        ...appointmentSlotOptionalProps,
      };
      const dto = plainToInstance(AppointmentSlotDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const dto = plainToInstance(AppointmentSlotDto, baseAppointmentSlot);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        id: faker.datatype.number(),
      };
      const dto = plainToInstance(AppointmentSlotDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'careRequestId must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${PatientDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        ...basePatientDto,
        ...patientOptionalProps,
      };
      const dto = plainToInstance(PatientDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const dto = plainToInstance(PatientDto, basePatientDto);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        email: 'email@example.com',
        dob: '01/01/2000',
        gender: 'Male',
        ehrId: faker.datatype.number().toString(),
      };
      const dto = plainToInstance(CareRequestDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${CurrentStateDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const dto = plainToInstance(CurrentStateDto, currentState);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        name: 'accepted',
      };
      const dto = plainToInstance(CurrentStateDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${EtaRangeDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const dto = plainToInstance(EtaRangeDto, etaRange);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        careRequestId: faker.datatype.number(),
      };
      const dto = plainToInstance(EtaRangeDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${MarketDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const dto = plainToInstance(MarketDto, market);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        shortName: 'DEN',
      };
      const dto = plainToInstance(MarketDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});

describe(`${ProviderDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const dto = plainToInstance(ProviderDto, provider);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        firstName: faker.name.firstName(),
      };
      const dto = plainToInstance(ProviderDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('id must be a string');
    });
  });
});

describe(`${ServiceLine.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const dto = plainToInstance(ServiceLine, serviceLine);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        name: 'acute',
      };
      const dto = plainToInstance(ServiceLine, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'id must be a number conforming to the specified constraints'
      );
    });
  });
});
