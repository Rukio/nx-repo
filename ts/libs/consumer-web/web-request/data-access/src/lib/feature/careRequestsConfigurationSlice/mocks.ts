import { CreateCareRequestPayload } from './types';

export const mockCreateCareRequestDataPayload: Required<CreateCareRequestPayload> =
  {
    address: {
      streetAddress1: '430 Test',
      streetAddress2: 'Test County',
      city: 'Test',
      state: 'TES',
      postalCode: '80002',
    },
    caller: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+13012312123',
      relationshipToPatient: 'patient',
    },
    complaint: { symptoms: 'Test' },
    patient: {
      birthday: '1963-01-01T00:00:00Z',
      email: '',
      firstName: 'Jane Doe',
      lastName: 'Last name',
      phone: '+13012312123',
      sex: 'M',
    },
    statsigStableId: '111',
    token: '123',
    type: 'web',
    marketingMetaData: {
      source: 'test',
    },
    patientPreferredEta: {
      patientPreferredEtaStart: '2020-04-30T00:00:00Z',
      patientPreferredEtaEnd: '2020-04-30T04:00:00Z',
    },
  };
