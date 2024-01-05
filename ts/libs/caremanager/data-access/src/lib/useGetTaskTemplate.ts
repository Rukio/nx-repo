import { useQuery } from 'react-query';
import useApi from './useApi';

export const useGetTaskTemplate = (taskTemplateId: string, isEdit = false) => {
  const { API } = useApi();

  return useQuery(
    ['taskTemplates', taskTemplateId],
    () =>
      API.careManagerServiceGetTaskTemplate({
        taskTemplateId,
      }),
    {
      enabled: isEdit,
    }
  );
};
