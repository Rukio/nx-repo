import { useGetMarkets } from '@*company-data-covered*/caremanager/data-access';
import { Filter, Search } from '@*company-data-covered*/caremanager/ui';
import {
  Box,
  Theme,
  Typography,
  makeSxStyles,
  useMediaQuery,
} from '@*company-data-covered*/design-system';
import { useFiltersContext } from './FiltersContext';
import { useCallback, useState } from 'react';
import { useDebouncedEffect } from '@*company-data-covered*/caremanager/utils-react';
import { StatusIdFilter } from './StatusIdFilter';

const styles = makeSxStyles({
  container: {
    marginBottom: 2,
    display: { xs: 'block', sm: 'flex' },
    alignItems: 'center',
  },
  searchContainer: {
    width: { xs: 'auto', sm: 295 },
    marginRight: { xs: 0, sm: 2 },
    marginBottom: { xs: 2, sm: 0 },
    '.MuiTextField-root': {
      backgroundColor: (theme) => theme.palette.grey[100],
    },
  },
  otherFiltersContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    color: (theme) => theme.palette.text.secondary,
    marginRight: 2,
    flexShrink: 0,
  },
  filterChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
  },
});

export const Filters = () => {
  const {
    marketIds,
    setMarketIds,
    searchTerm,
    setSearchTerm,
    statusId,
    setStatusId,
  } = useFiltersContext();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  const {
    result: { markets },
  } = useGetMarkets();

  const marketsCustomLabel =
    marketIds.length > 3 ? `${marketIds.length} markets selected` : undefined;

  const updateContextSearchTerm = useCallback(() => {
    localSearchTerm !== searchTerm && setSearchTerm(localSearchTerm);
  }, [searchTerm, localSearchTerm, setSearchTerm]);
  useDebouncedEffect(updateContextSearchTerm, 450);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.searchContainer}>
        <Search
          placeholder="Search"
          testId="service-requests-search-term"
          inputTestid="service-requests-search-term-input"
          onChange={(term) => {
            setLocalSearchTerm(term);
          }}
          value={localSearchTerm}
        />
      </Box>
      <Box sx={styles.otherFiltersContainer}>
        <Typography variant="body2" sx={styles.label}>
          Filter By
        </Typography>
        <Box sx={styles.filterChips}>
          {isMobile && (
            <StatusIdFilter statusId={statusId} setStatusId={setStatusId} />
          )}
          {markets && (
            <Filter
              items={markets}
              testid="service-requests-market-ids"
              defaultLabel="Markets"
              selectedIds={marketIds}
              setSelectedIds={setMarketIds}
              customLabel={marketsCustomLabel}
              isSearchable
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
