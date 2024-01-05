import { useQuery } from 'react-query';
import { CareManagerServiceGetVisitRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useGetVisit = (input: CareManagerServiceGetVisitRequest) => {
  const { API } = useApi();

  return useQuery(visitKeys.detail(input.visitId), () =>
    API.careManagerServiceGetVisit(input)
  );
};
