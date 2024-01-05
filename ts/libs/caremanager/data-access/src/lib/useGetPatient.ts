import { UseQueryOptions, useQuery } from 'react-query';
import { GetPatientResponse } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

type Options = Omit<
  UseQueryOptions<GetPatientResponse>,
  'queryKey' | 'queryFn'
>;

export const useGetPatient = (patientId: string, options?: Options) => {
  const { API } = useApi();

  return useQuery<GetPatientResponse>(
    patientKeys.detail(patientId),
    () => API.careManagerServiceGetPatient({ patientId }),
    options
  );
};
