import { useMutation } from 'react-query';
import {
  CareManagerServiceDuplicateEpisodeLatestVisitRequest,
  DuplicateEpisodeLatestVisitResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useDuplicateEpisodeLatestVisit = () => {
  const { API } = useApi();

  return useMutation<
    DuplicateEpisodeLatestVisitResponse,
    unknown,
    CareManagerServiceDuplicateEpisodeLatestVisitRequest
  >('duplicateEpisodeLatestVisit', (input) =>
    API.careManagerServiceDuplicateEpisodeLatestVisit(input)
  );
};
