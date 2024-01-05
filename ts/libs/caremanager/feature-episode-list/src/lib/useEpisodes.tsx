import { useCallback, useEffect, useState } from 'react';
import { theme, useMediaQuery } from '@*company-data-covered*/design-system';
import {
  useGetConfig,
  useGetEpisodes,
} from '@*company-data-covered*/caremanager/data-access';
import {
  CareManagerServiceGetEpisodesRequest,
  CarePhase,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  ROWS_PER_PAGE_OPTIONS,
  SEARCH_DEBOUNCE_TIME,
} from '@*company-data-covered*/caremanager/utils';
import {
  useDebouncedEffect,
  useSearchParams,
} from '@*company-data-covered*/caremanager/utils-react';

const [defaultPageSize] = ROWS_PER_PAGE_OPTIONS;

const getClosedCarePhaseIds = (carePhases?: CarePhase[]): string[] => {
  if (!carePhases) {
    return [];
  }

  return carePhases.reduce((acum: string[], item) => {
    if (item.name.startsWith('Closed')) {
      acum.push(item.id.toString());
    }

    return acum;
  }, []);
};

const everySelectedIsClosed = (
  selectedIds: string[],
  carePhases?: CarePhase[]
): boolean => {
  const closedIds = getClosedCarePhaseIds(carePhases);
  selectedIds.sort((a, b) => a.localeCompare(b));
  closedIds.sort((a, b) => a.localeCompare(b));

  return JSON.stringify(selectedIds) === JSON.stringify(closedIds);
};

const defaultCarePhaseFilter = (
  carePhases?: CarePhase[]
): string[] | undefined => {
  if (!carePhases) {
    return undefined;
  }

  return carePhases.reduce<string[]>((result, carePhase) => {
    if (!carePhase.name.startsWith('Closed')) {
      result.push(carePhase.id.toString());
    }

    return result;
  }, []);
};

export const getCarePhases = (
  paramIds: string | string[] | undefined,
  carePhases?: CarePhase[]
): string[] | undefined => {
  if (paramIds) {
    const result = [paramIds].flat();
    if (everySelectedIsClosed(result, carePhases)) {
      // filter by all Care Phases
      return undefined;
    }

    return result;
  }

  return defaultCarePhaseFilter(carePhases);
};

const useEpisodes = () => {
  const { data: config, isFetched: configFetched } = useGetConfig();
  const { setSearchParams, searchParams, searchParamsObject } =
    useSearchParams<CareManagerServiceGetEpisodesRequest>();

  const {
    page,
    pageSize,
    marketId,
    serviceLineId,
    carePhaseId,
    incompleteTask,
  } = searchParamsObject;

  const queryData = {
    marketId: searchParamsObject.marketId
      ? [searchParamsObject.marketId].flat()
      : undefined,
    serviceLineId: searchParamsObject.serviceLineId
      ? [searchParamsObject.serviceLineId].flat()
      : undefined,
    carePhaseId: getCarePhases(
      searchParamsObject.carePhaseId,
      config?.carePhases
    ),
    patientName: searchParamsObject.patientName?.toString(),
    incompleteTask: searchParamsObject.incompleteTask === 'true',
    page: searchParamsObject.page?.toString(),
    pageSize: searchParamsObject.pageSize?.toString(),
  };

  const parsedPage = Number(page) ?? 1;

  const {
    data: tableData,
    isFetched,
    isLoading,
    error,
  } = useGetEpisodes(queryData, {
    placeholderData: {
      episodes: [],
      meta: {
        totalPages: '0',
        totalResults: '0',
        pageSize: '50',
        currentPage: '1',
      },
    },
    onSettled: (data) => {
      if (
        data?.episodes.length === 0 &&
        parsedPage > Number(data.meta?.totalPages)
      ) {
        searchParamsObject.page = data.meta?.totalPages;
      }
      setSearchParams(searchParamsObject);
    },
    notifyOnChangeProps: 'tracked',
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const setSelectedMarkets = (marketIds: string[]) => {
    setSearchParams({ marketId: marketIds });
  };
  const setSelectedServiceLines = (_serviceLineId: string[]) => {
    setSearchParams({ serviceLineId: _serviceLineId });
  };
  const setSelectedCarePhases = (_carePhaseId: string[]) => {
    setSearchParams({ carePhaseId: _carePhaseId });
  };
  const setIncompleteTasksSelected = (_flag: boolean) => {
    setSearchParams({ incompleteTask: _flag });
  };

  const resetFilters = () => {
    setSearchParams({
      marketId: [],
      serviceLineId: [],
      carePhaseId: [],
      incompleteTask: false,
    });
  };

  const setRowsPerPage = useCallback(
    (p: number) => setSearchParams({ pageSize: p.toString(), page: '1' }),
    [setSearchParams]
  );
  const setPage = useCallback(
    (p: number) => setSearchParams({ page: p.toString() }),
    [setSearchParams]
  );

  const currentPage = parsedPage - 1;
  const tablePaginationPage = currentPage < 0 ? 0 : currentPage;

  const [patientName, setPatientName] = useState(
    searchParamsObject.patientName?.toString()
  );
  const onSearchChange = useCallback((newPatientName: string) => {
    if (!/[^a-zA-Z-' ]/g.test(newPatientName)) {
      setPatientName(newPatientName);
    }
  }, []);
  const setPatientNameParam = useCallback(() => {
    setSearchParams({ patientName });
  }, [patientName, setSearchParams]);

  useDebouncedEffect(setPatientNameParam, SEARCH_DEBOUNCE_TIME);
  useEffect(() => {
    if (config && !Array.from(searchParams.keys()).length) {
      setSearchParams({
        marketId: [],
        serviceLineId: [],
        carePhaseId: [],
        pageSize: defaultPageSize.toString(),
        page: '1',
      });
    }
  }, [config, searchParams, setSearchParams]);

  return {
    isMobile,
    onSearchChange,
    patientName,
    config,
    setSelectedMarkets,
    setSelectedCarePhases,
    setSelectedServiceLines,
    selectedMarkets: marketId ? [marketId].flat() : [],
    selectedCarePhases: carePhaseId ? [carePhaseId].flat() : [],
    selectedServiceLines: serviceLineId ? [serviceLineId].flat() : [],
    setIncompleteTasksSelected,
    incompleteTasksSelected: incompleteTask === 'true',
    isLoading,
    episodes: tableData?.episodes || [],
    tablePaginationPage,
    totalPages: Number(tableData?.meta?.totalPages),
    rowsPerPage: Number(pageSize) || defaultPageSize,
    totalResults: Number(tableData?.meta?.totalResults),
    isFetched: configFetched && isFetched,
    setRowsPerPage,
    setPage,
    resetFilters,
    error,
  };
};

export default useEpisodes;
