import { useSelector } from 'react-redux';
import {
  makeSxStyles,
  Container,
  Box,
  Pagination,
  Typography,
  Chip,
  Button,
} from '@*company-data-covered*/design-system';
import {
  resetProviderVisitsState,
  setProviderVisitsIsAbxPrescribed,
  setProviderVisitsIsEscalated,
  setProviderVisitsPage,
  setProviderVisitsSearchText,
  transformProviderVisitsParams,
  useAppDispatch,
  useGetProviderVisitsQuery,
  selectProviderVisitsSearchFilters,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { DefaultAlert, SearchField } from '@*company-data-covered*/clinical-kpi/ui';

import ProviderVisitsTable from './components/ProviderVisitsTable/ProviderVisitsTable';
import { PROVIDER_VISITS_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    container: (theme) => ({
      mt: 3,
      backgroundColor: theme.palette.common.white,
      py: 3,
      px: 2,
    }),
    pagination: (theme) => ({
      margin: `${theme.spacing()} 0 0 auto`,
      width: 'fit-content',

      '& .MuiPaginationItem-previousNext': {
        color: theme.palette.primary.main,
      },
      '& .Mui-disabled': {
        color: theme.palette.text.primary,
      },
    }),
    searchFilterContainer: {
      display: 'flex',
      mt: 3,
    },
    filterContainer: {
      display: 'flex',
      alignItems: 'center',
      ml: 2,
      gap: 2,
    },
    chip: (theme) => ({
      border: '1px solid',
      borderColor: theme.palette.grey[100],
      backgroundColor: theme.palette.common.white,
    }),
    chipActive: (theme) => ({
      backgroundColor: theme.palette.grey[100],
    }),
  });

export type ProviderVisitsProps = {
  providerId: string;
};

const ProviderVisits = ({ providerId }: ProviderVisitsProps) => {
  const styles = makeStyles();

  const { page, searchText, isEscalated, isAbxPrescribed } = useSelector(
    selectProviderVisitsSearchFilters
  );

  const dispatch = useAppDispatch();

  const onChangePage = (pageNew: number) => {
    dispatch(setProviderVisitsPage({ page: pageNew }));
  };

  const handleSearchChange = (value: string) =>
    dispatch(setProviderVisitsSearchText({ searchText: value }));

  const handleEscalatedClick = () =>
    dispatch(
      setProviderVisitsIsEscalated({
        isEscalated: !isEscalated,
      })
    );

  const handleAbxClick = () =>
    dispatch(
      setProviderVisitsIsAbxPrescribed({
        isAbxPrescribed: !isAbxPrescribed,
      })
    );

  const handleClearFilters = () => dispatch(resetProviderVisitsState());

  const {
    data: providerVisits,
    isLoading,
    isError,
  } = useGetProviderVisitsQuery(
    transformProviderVisitsParams({
      providerId,
      page,
      searchText,
      isAbxPrescribed,
      isEscalated,
    })
  );

  const handlePageChange = (_: unknown, i: number) => onChangePage(i);

  if (isError || (!providerVisits && !isLoading)) {
    return (
      <DefaultAlert dataTestId={PROVIDER_VISITS_TEST_IDS.DEFAULT_ERROR_ALERT} />
    );
  }

  return (
    <Container>
      <Box sx={styles.container}>
        <Typography data-testid={PROVIDER_VISITS_TEST_IDS.HEADER}>
          Latest Visits
        </Typography>
        <Box sx={styles.searchFilterContainer}>
          <SearchField onChange={handleSearchChange} debounceDelayMs={500} />
          <Box sx={styles.filterContainer}>
            <Typography variant="body2">Filter by</Typography>
            <Chip
              data-testid={PROVIDER_VISITS_TEST_IDS.FILTER_ABX}
              sx={[styles.chip, isAbxPrescribed && styles.chipActive]}
              label="ABX"
              onClick={handleAbxClick}
            />
            <Chip
              data-testid={PROVIDER_VISITS_TEST_IDS.FILTER_ESCALATED}
              sx={[styles.chip, isEscalated && styles.chipActive]}
              label="Escalated"
              onClick={handleEscalatedClick}
            />
            <Button variant="text" onClick={handleClearFilters}>
              Clear All
            </Button>
          </Box>
        </Box>
        <Box mt={3}>
          <ProviderVisitsTable
            providerVisits={providerVisits?.providerVisits}
            isLoading={isLoading}
          />
          <Pagination
            data-testid={PROVIDER_VISITS_TEST_IDS.PAGINATION}
            page={page}
            count={parseInt(providerVisits?.pagination?.totalPages || '0')}
            sx={styles.pagination}
            onChange={handlePageChange}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ProviderVisits;
