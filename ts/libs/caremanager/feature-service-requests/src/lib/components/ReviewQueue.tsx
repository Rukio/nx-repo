import { FC, useEffect } from 'react';
import { useGetServiceRequestStatus } from '@*company-data-covered*/caremanager/data-access';
import {
  Box,
  Container,
  Theme,
  makeSxStyles,
  useMediaQuery,
} from '@*company-data-covered*/design-system';
import { ReviewQueueColumn } from './ReviewQueueColumn';
import { Sidebar } from './Sidebar';
import { Filters } from './Filters';
import { useFiltersContext } from './FiltersContext';

const statusColumnSlugs = [
  'requested',
  'clinical_screening',
  'secondary_screening',
  'accepted',
];

const styles = makeSxStyles({
  container: {
    padding: {
      xs: 1.5,
      md: 3,
    },
  },
  columnsContainer: {
    display: 'flex',
    gap: 1,
  },
});

export const ReviewQueue: FC = () => {
  const { data: statusData, isLoading: isLoadingStatus } =
    useGetServiceRequestStatus();
  const { statusId, setStatusId } = useFiltersContext();
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  useEffect(() => {
    if (!statusData || !statusData.list[0]) {
      return;
    }
    const newStatusId = isMobile ? statusData.list[0].id : null;
    statusId !== newStatusId &&
      setStatusId(isMobile ? statusData.list[0].id : null);
  }, [isMobile, statusData, statusId, setStatusId]);

  if (isLoadingStatus || !statusData) {
    return null;
  }

  return (
    <Container
      sx={styles.container}
      maxWidth="xl"
      data-testid="review-queue-section"
    >
      <Filters />
      <Box sx={styles.columnsContainer}>
        {statusColumnSlugs
          .filter(
            (slug) => !statusId || statusData.statusMap[slug]?.id === statusId
          )
          .map((slug) =>
            statusData.statusMap[slug] ? (
              <ReviewQueueColumn
                key={slug}
                status={statusData.statusMap[slug]}
                data-testid={`${slug}-review-queue-column`}
              />
            ) : null
          )}
      </Box>
      <Sidebar />
    </Container>
  );
};
