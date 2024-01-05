import { useQuery } from 'react-query';
import { GetPatientsResponse } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

const DEFAULT_PAGE_SIZE = '2';

export const useGetPatients = (
  name: string,
  pageSize: string = DEFAULT_PAGE_SIZE
) => {
  const { API } = useApi();

  return useQuery<GetPatientsResponse>(
    patientKeys.list({ name, pageSize }),
    () =>
      API.careManagerServiceGetPatients({
        name,
        pageSize,
      }),
    {
      enabled: !!name,
      staleTime: 1000,
    }
  );
};
