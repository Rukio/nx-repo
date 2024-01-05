import { CareManagerServiceGetPatientsRequest } from '@*company-data-covered*/caremanager/data-access-types';

export const patientKeys = {
  all: [{ entity: 'patients' }] as const,
  lists: () => [{ ...patientKeys.all[0], scope: 'list' }] as const,
  list: (filters: CareManagerServiceGetPatientsRequest) =>
    [{ ...patientKeys.lists()[0], filters }] as const,
  details: () => [{ ...patientKeys.all[0], scope: 'details' }] as const,
  detail: (id: string) => [{ ...patientKeys.details()[0], id }] as const,
};
