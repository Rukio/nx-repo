import {
  LeaderHubIndividualProviderLatestVisit,
  LeaderHubIndividualProviderVisitsResponse,
} from '../../types';

export const buildMockVisit = (
  id: number,
  init: Partial<LeaderHubIndividualProviderLatestVisit> = {}
): LeaderHubIndividualProviderLatestVisit => {
  const result: LeaderHubIndividualProviderLatestVisit = {
    careRequestId: `${id}`,
    providerId: `116600`,
    patientFirstName: `Patient${id}`,
    patientLastName: `Name${id}`,
    patientAthenaId: `${id}0`,
    serviceDate: {
      year: 2023,
      month: 7,
      day: 2,
    },
    chiefComplaint: `Skin infection (cellulitis) ${id}`,
    diagnosis: `LLE Cellulitis w failure of outpatient tx ${id}.`,
    isAbxPrescribed: id % 2 === 0,
    abxDetails: `some abx details ${id}`,
    isEscalated: id % 2 === 0,
    escalatedReason: `some escalation reason ${id}`,
  };

  return Object.assign(result, init);
};

export const mockedVisitsResponse: LeaderHubIndividualProviderVisitsResponse = {
  providerVisits: new Array(10).fill(0).map((_, i) => buildMockVisit(i)),
  pagination: {
    total: '20',
    page: 1,
    totalPages: '2',
  },
};
