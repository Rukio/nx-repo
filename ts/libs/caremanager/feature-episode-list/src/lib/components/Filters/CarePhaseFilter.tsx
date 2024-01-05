import React, { useMemo } from 'react';
import { Chip, FormLabel, makeSxStyles } from '@*company-data-covered*/design-system';
import { CarePhase } from '@*company-data-covered*/caremanager/data-access-types';
import {
  Filter,
  FilterCheckbox,
  removeItems,
} from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  subheading: { fontSize: '12px' },
});

interface CarePhaseFilterProps {
  items?: CarePhase[];
  selectedIds: string[];
  setSelectedIds: (_: string[]) => void;
  customLabel?: string;
}

const changeLowAcuityToTransition = (longName: string) => {
  if (longName === 'Low Acuity') {
    return 'Transition - High';
  }

  return longName;
};

const splitByType = (items: CarePhase[], type: string) =>
  items
    .filter(
      ({ phaseType, name }) => phaseType === type && !name.startsWith('Closed')
    )
    .map((carePhase) => ({
      longName: changeLowAcuityToTransition(carePhase.name),
      shortName: carePhase.name,
      id: carePhase.id,
    }));

const CarePhaseFilter: React.FC<CarePhaseFilterProps> = React.memo(
  ({ items = [], selectedIds, setSelectedIds, customLabel }) => {
    const defaultLabel = 'Care Phases';
    const allCarePhases = useMemo(
      () => [
        {
          subheading: 'Active',
          items: splitByType(items, 'active'),
        },
        {
          subheading: 'Inactive',
          items: splitByType(items, 'inactive'),
        },
      ],
      [items]
    );
    const closedCarePhase = items.find((item) => item.name === 'Closed');
    const closedWithoutAdmittingCarePhase = items.find(
      (item) => item.name === 'Closed Without Admitting'
    );
    const isClosedSelected =
      closedCarePhase?.id && selectedIds.includes(closedCarePhase.id);

    return (
      <>
        <Filter
          items={items || []}
          testid="care-phase"
          defaultLabel={defaultLabel}
          selectedIds={selectedIds.filter(
            (id) =>
              id !== closedCarePhase?.id &&
              id !== closedWithoutAdmittingCarePhase?.id
          )}
          setSelectedIds={setSelectedIds}
          customLabel={customLabel}
        >
          {allCarePhases.map((carePhase) => (
            <React.Fragment key={carePhase.subheading}>
              <FormLabel
                color="secondary"
                data-testid={`care-phase-${carePhase.subheading.toLowerCase()}-subheading`}
                sx={styles.subheading}
              >
                {carePhase.subheading.toUpperCase()}
              </FormLabel>
              {carePhase.items.map((filter) => (
                <FilterCheckbox
                  key={filter.id}
                  filter={filter}
                  setSelectedItems={setSelectedIds}
                  selectedItems={selectedIds}
                  listDecoration
                />
              ))}
            </React.Fragment>
          ))}
        </Filter>
        {closedCarePhase && closedWithoutAdmittingCarePhase && (
          <Chip
            data-testid="closed-care-phase-filter"
            variant="outlined"
            color={isClosedSelected ? 'primary' : 'default'}
            label={isClosedSelected ? 'Hide Closed' : 'Show Closed'}
            onClick={() =>
              isClosedSelected
                ? (() => {
                    removeItems(
                      [closedCarePhase.id, closedWithoutAdmittingCarePhase.id],
                      setSelectedIds,
                      selectedIds
                    );
                  })()
                : setSelectedIds([
                    ...selectedIds,
                    closedCarePhase.id,
                    closedWithoutAdmittingCarePhase.id,
                  ])
            }
          />
        )}
      </>
    );
  }
);

export default CarePhaseFilter;
