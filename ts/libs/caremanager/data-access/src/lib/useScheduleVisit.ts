import { useMutation, useQueryClient } from 'react-query';
import { CareManagerServiceScheduleVisitRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useScheduleVisit = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    'scheduleVisit',
    (input: CareManagerServiceScheduleVisitRequest) =>
      API.careManagerServiceScheduleVisit(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          visitKeys.episodeVisitList(episodeId)
        );
      },
    }
  );
};
