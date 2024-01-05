import React, { useCallback, useMemo } from 'react';
import {
  Chip,
  Stack,
  Typography,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';
import { GetConfigResponse } from '@*company-data-covered*/caremanager/data-access-types';

import CarePhaseFilter from './CarePhaseFilter';
import IncompleteTaskFilter from './IncompleteTaskFilter';
import { Filter } from '@*company-data-covered*/caremanager/ui';

const MAX_ELEMENTS = 3;

const styles = makeSxStyles({
  container: {
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { width: 0, height: 0 },
  },
  clearAll: { borderColor: 'transparent' },
  title: { padding: '5px 5px 14px 15px', fontSize: '14px' },
});

type FiltersSectionProps = {
  configData?: GetConfigResponse;
  setSelectedMarkets?: (_: string[]) => void;
  setSelectedCarePhases: (_: string[]) => void;
  setSelectedServiceLines: (_: string[]) => void;
  setIncompleteTasksSelected?: (_: boolean) => void;
  selectedMarkets?: string[];
  selectedCarePhases: string[];
  selectedServiceLines: string[];
  incompleteTasksSelected?: boolean;
  handleClearAll: () => void;
};

export const FiltersSection: React.FC<FiltersSectionProps> = React.memo(
  ({
    configData,
    setSelectedMarkets,
    setSelectedCarePhases,
    setSelectedServiceLines,
    setIncompleteTasksSelected,
    selectedMarkets,
    selectedCarePhases,
    selectedServiceLines,
    incompleteTasksSelected,
    handleClearAll,
  }) => {
    const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

    const anyFiltersSelected = () => {
      if (incompleteTasksSelected) {
        return true;
      }
      const allFilters = [
        selectedMarkets,
        selectedCarePhases,
        selectedServiceLines,
      ];

      return allFilters.some((item) => item && item.length > 0);
    };

    const getCustomLabel = useCallback(
      (
        filterName: 'markets' | 'serviceLines' | 'carePhases',
        selectedEntity: string[] | undefined
      ) => {
        const useDefaultLabel =
          !selectedEntity ||
          selectedEntity.length <= MAX_ELEMENTS ||
          !configData;
        if (useDefaultLabel) {
          return undefined;
        }
        let filterItemsLength = configData[filterName].length;
        if (filterName === 'carePhases') {
          // "Closed" and "Closed Without Admitting" Care Phases are separated
          // in another filter
          filterItemsLength -= 2;
        }
        const allEntitiesSelected = selectedEntity.length === filterItemsLength;
        if (allEntitiesSelected) {
          const labelsMap = {
            markets: 'Markets',
            serviceLines: 'Service Lines',
            carePhases: 'Care Phases',
          };

          return `All ${selectedEntity.length} ${labelsMap[filterName]}`;
        }

        return `${selectedEntity.length} Selected`;
      },
      [configData]
    );

    const marketCustomLabel = useMemo(
      () => getCustomLabel('markets', selectedMarkets),
      [selectedMarkets, getCustomLabel]
    );

    const serviceLinesCustomLabel = useMemo(
      () => getCustomLabel('serviceLines', selectedServiceLines),
      [selectedServiceLines, getCustomLabel]
    );

    const closedCarePhases = configData?.carePhases.filter(
      ({ name }: { name: string }) => name.startsWith('Closed')
    );
    const closedCarePhasesIds = closedCarePhases?.map(({ id }) => id);
    const carePhasesCustomLabel = useMemo(
      () =>
        getCustomLabel(
          'carePhases',
          selectedCarePhases.filter(
            (item) => !closedCarePhasesIds?.includes(item)
          )
        ),
      [selectedCarePhases, getCustomLabel, closedCarePhasesIds]
    );

    return (
      <Stack
        mt={0.5}
        mb={0.5}
        direction="row"
        spacing={1}
        flexWrap={isMobile ? 'nowrap' : 'wrap'}
        overflow="auto"
        sx={styles.container}
        data-testid="filters-section"
      >
        {!isMobile && (
          <Typography
            color="text.secondary"
            sx={styles.title}
            data-testid="filter-by-text"
          >
            Filter by
          </Typography>
        )}
        {setSelectedMarkets && selectedMarkets && (
          <Filter
            items={configData?.markets}
            testid="market"
            defaultLabel="Markets"
            selectedIds={selectedMarkets}
            setSelectedIds={setSelectedMarkets}
            customLabel={marketCustomLabel}
            isSearchable
          />
        )}
        <Filter
          items={configData?.serviceLines}
          testid="service-line"
          setSelectedIds={setSelectedServiceLines}
          selectedIds={selectedServiceLines}
          defaultLabel="Service Lines"
          customLabel={serviceLinesCustomLabel}
        />
        <CarePhaseFilter
          items={configData?.carePhases}
          setSelectedIds={setSelectedCarePhases}
          selectedIds={selectedCarePhases}
          customLabel={carePhasesCustomLabel}
        />
        {setIncompleteTasksSelected &&
          incompleteTasksSelected !== undefined && (
            <IncompleteTaskFilter
              setSelected={setIncompleteTasksSelected}
              selected={incompleteTasksSelected}
            />
          )}
        {anyFiltersSelected() ? (
          <Chip
            data-testid="clear-all-button"
            variant="outlined"
            color="primary"
            label="Clear All"
            sx={styles.clearAll}
            onClick={handleClearAll}
          />
        ) : null}
      </Stack>
    );
  }
);
