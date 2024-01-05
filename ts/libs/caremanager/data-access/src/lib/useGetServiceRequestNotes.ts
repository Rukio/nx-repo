import { useQuery } from 'react-query';
import useApi from './useApi';
import { noteKeys } from './noteKeys';

export const useGetServiceRequestNotes = (serviceRequestId: string) => {
  const { API } = useApi();
  const queryKey = noteKeys.list({
    parentEntity: 'ServiceRequest',
    parentEntityId: serviceRequestId,
  });

  return useQuery(queryKey, () =>
    API.careManagerServiceGetServiceRequestNotes({ serviceRequestId })
  );
};
