import { CareManagerServiceGetServiceRequestsRequest } from '@*company-data-covered*/caremanager/data-access-types';

export const serviceRequestKeys = {
  all: [{ entity: 'serviceRequests' }] as const,
  lists: () => [{ ...serviceRequestKeys.all[0], scope: 'list' }] as const,
  list: (filters: CareManagerServiceGetServiceRequestsRequest) =>
    [{ ...serviceRequestKeys.lists()[0], filters }] as const,
  details: () => [{ ...serviceRequestKeys.all[0], scope: 'details' }] as const,
  detail: (id: string) => [{ ...serviceRequestKeys.details()[0], id }] as const,
};
