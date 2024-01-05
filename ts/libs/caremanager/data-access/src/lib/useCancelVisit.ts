import { useMutation } from 'react-query';
import { CareManagerServiceCancelVisitRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useCancelVisit = () => {
  const { API } = useApi();

  return useMutation(
    'cancelVisit',
    (input: CareManagerServiceCancelVisitRequest) =>
      API.careManagerServiceCancelVisit(input)
  );
};
