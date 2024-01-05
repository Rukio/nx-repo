import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { ServiceLine } from '@*company-data-covered*/caremanager/data-access-types';
import { useGetConfig } from './useGetConfig';

type GetServiceLine = (id?: ServiceLine['id']) => ServiceLine | undefined;

export function useGetServiceLines(): [
  GetServiceLine,
  ServiceLine[] | undefined
] {
  const { data } = useGetConfig();

  const { data: serviceLineMap } = useQuery(
    ['serviceLinesMap'],
    () =>
      data?.serviceLines.reduce<{
        [key: string]: ServiceLine;
      }>((map, serviceLine) => {
        map[serviceLine.id] = serviceLine;

        return map;
      }, {}),
    {
      enabled: !!data?.serviceLines,
    }
  );

  const getServiceLine: GetServiceLine = useCallback(
    (serviceLineId) =>
      serviceLineId ? serviceLineMap?.[serviceLineId] : undefined,
    [serviceLineMap]
  );

  return [getServiceLine, data?.serviceLines];
}
