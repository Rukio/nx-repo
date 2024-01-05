import { QueryKey, UseQueryOptions, useQuery } from 'react-query';
import {
  CareManagerServiceGetTaskTemplatesRequest,
  GetTaskTemplatesResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

type Options = Omit<
  UseQueryOptions<
    GetTaskTemplatesResponse,
    unknown,
    GetTaskTemplatesResponse,
    QueryKey
  >,
  'queryFn'
>;

export const useGetTaskTemplates = (
  input: CareManagerServiceGetTaskTemplatesRequest,
  options: Options = {}
) => {
  const { API } = useApi();

  return useQuery<GetTaskTemplatesResponse>(
    options.queryKey || 'getTaskTemplates',
    () => API.careManagerServiceGetTaskTemplates(input),
    options
  );
};
