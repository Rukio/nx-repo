import { useMutation } from 'react-query';
import {
  CanScheduleVisitResponse,
  CareManagerServiceCanScheduleVisitRequest,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useCanScheduleVisit = () => {
  const { API } = useApi();

  return useMutation<
    CanScheduleVisitResponse,
    unknown,
    CareManagerServiceCanScheduleVisitRequest
  >('canScheduleVisit', (input) =>
    API.careManagerServiceCanScheduleVisit(input)
  );
};
