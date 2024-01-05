import { useCallback, useEffect, useState } from 'react';
import { isEmpty, reject } from 'rambda';
import {
  ROWS_PER_PAGE_OPTIONS,
  SEARCH_DEBOUNCE_TIME,
} from '@*company-data-covered*/caremanager/utils';
import {
  useGetConfig,
  useGetTaskTemplates,
} from '@*company-data-covered*/caremanager/data-access';
import {
  CareManagerServiceGetTaskTemplatesRequest,
  GetTaskTemplatesResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  useDebouncedEffect,
  useSearchParams,
} from '@*company-data-covered*/caremanager/utils-react';

const DEFAULT_PAGE_SIZE = ROWS_PER_PAGE_OPTIONS[0].toString();
const defaultQueryParams = {
  page: '1',
  pageSize: DEFAULT_PAGE_SIZE,
  sortDirection: 'asc',
  sortBy: 'name',
};
const placeholderData: GetTaskTemplatesResponse = {
  taskTemplates: [],
  meta: {
    totalPages: '0',
    totalResults: '0',
    pageSize: '50',
    currentPage: '1',
  },
};

const useTaskTemplates = () => {
  const { data: config } = useGetConfig();
  const { setSearchParams, searchParams, searchParamsObject } =
    useSearchParams<CareManagerServiceGetTaskTemplatesRequest>();

  const emptyParams = Array.from(searchParams.keys()).length === 0;

  useEffect(() => {
    if (emptyParams) {
      setSearchParams(defaultQueryParams);
    }
  }, [emptyParams, setSearchParams]);

  const queryData = {
    page: searchParamsObject.page?.toString(),
    pageSize: searchParamsObject.pageSize?.toString(),
    name: searchParamsObject.name?.toString(),
    serviceLineId: searchParamsObject.serviceLineId
      ? [searchParamsObject.serviceLineId].flat()
      : undefined,
    carePhaseId: searchParamsObject.carePhaseId
      ? [searchParamsObject.carePhaseId].flat()
      : undefined,
    sortBy: searchParamsObject.sortBy?.toString(),
    sortDirection: searchParamsObject.sortDirection?.toString(),
  };

  const [taskTemplateName, setTaskTemplateName] = useState(
    queryData.name || ''
  );

  const setTemplateNameParam = useCallback(
    () =>
      setSearchParams({
        name: taskTemplateName,
        page:
          taskTemplateName === (queryData.name || '') ? queryData.page : '1',
      }),
    [taskTemplateName, setSearchParams, queryData.name, queryData.page]
  );

  useDebouncedEffect(setTemplateNameParam, SEARCH_DEBOUNCE_TIME);

  const {
    data: { taskTemplates, meta } = { taskTemplates: [] },
    isFetching,
    isLoading,
  } = useGetTaskTemplates(
    reject<unknown, CareManagerServiceGetTaskTemplatesRequest>(isEmpty)({
      ...queryData,
    }),
    {
      queryKey: ['taskTemplates', { query: queryData }],
      placeholderData,
      notifyOnChangeProps: 'tracked',
    }
  );

  const onSearchChange = useCallback((newTaskTemplateName: string) => {
    if (!/[^a-zA-Z0-9-' ]/g.test(newTaskTemplateName)) {
      setTaskTemplateName(newTaskTemplateName);
    }
  }, []);
  const toggleSortDirection = () =>
    queryData.sortDirection === 'asc' ? 'desc' : 'asc';
  const onSortChange = (sortBy: string) => {
    if (sortBy === queryData.sortBy) {
      setSearchParams({
        sortDirection: toggleSortDirection(),
        page: '1',
      });
    } else {
      setSearchParams({ sortBy, page: '1' });
    }
  };
  const setSelectedServiceLines = (serviceLineId: string[]) => {
    setSearchParams({ serviceLineId, page: '1' });
  };
  const setSelectedCarePhases = (carePhaseId: string[]) => {
    setSearchParams({ carePhaseId, page: '1' });
  };
  const setPage = (page: string) => {
    setSearchParams({ page });
  };
  const setPageSize = (pageSize: string) => {
    setSearchParams({ pageSize, page: '1' });
  };
  const resetFilters = () => {
    setTaskTemplateName('');
    setSearchParams({
      serviceLineId: [],
      carePhaseId: [],
      page: '1',
    });
  };

  return {
    config,
    isLoading: isFetching || isLoading,
    onSearchChange,
    onSortChange,
    order: queryData.sortDirection?.toLowerCase() as 'asc' | 'desc',
    orderBy: queryData.sortBy || '',
    page: queryData.page || '1',
    pageSize: queryData.pageSize || DEFAULT_PAGE_SIZE,
    resetFilters,
    selectedCarePhases: queryData.carePhaseId || [],
    selectedServiceLines: queryData.serviceLineId || [],
    setPage,
    setPageSize,
    setSelectedCarePhases,
    setSelectedServiceLines,
    taskTemplateName: taskTemplateName || '',
    taskTemplates,
    totalCount: meta?.totalResults || '0',
    totalPages: meta?.totalPages || '0',
  };
};

export default useTaskTemplates;
