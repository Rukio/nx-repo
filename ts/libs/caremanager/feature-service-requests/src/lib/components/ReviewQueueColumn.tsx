import { FC } from 'react';
import { ServiceRequestStatus } from '@*company-data-covered*/caremanager/data-access-types';
import { useGetServiceRequests } from '@*company-data-covered*/caremanager/data-access';
import {
  Box,
  Skeleton,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { ServiceRequestCard } from './ServiceRequestCard';
import { useSidebarContext } from './SidebarContext';
import { useFiltersContext } from './FiltersContext';

const styles = makeSxStyles({
  container: {
    flex: 1,
    paddingX: 1.5,
    paddingY: 3,
    backgroundColor: (theme) => theme.palette.grey[100],
    borderRadius: 1,
  },
  title: {
    paddingLeft: 1.5,
    marginBottom: 2.5,
  },
  columnSkeleton: {
    flex: 1,
    height: 540,
  },
});

type Props = {
  status: ServiceRequestStatus;
  'data-testid'?: string;
};

export const ReviewQueueColumn: FC<Props> = ({
  status,
  'data-testid': testId,
}) => {
  const { selectedRequestId, openSidebar } = useSidebarContext();
  const { searchTerm, marketIds } = useFiltersContext();

  const { data, isLoading } = useGetServiceRequests({
    statusIds: [status.id],
    marketIds: marketIds.length ? marketIds : undefined,
    searchTerm: searchTerm || undefined,
  });

  if (isLoading || !data) {
    return <Skeleton sx={styles.columnSkeleton} variant="rounded" />;
  }

  return (
    <Box sx={styles.container} data-testid={testId}>
      <Typography variant="h6" sx={styles.title}>
        {status.name}
      </Typography>
      {data.serviceRequests.map((item) => (
        <ServiceRequestCard
          key={item.serviceRequest?.id}
          data={item}
          data-testid={`service-request-card-${item.serviceRequest?.id}`}
          selected={item.serviceRequest?.id === selectedRequestId}
          onSelect={() =>
            item.serviceRequest?.id && openSidebar?.(item.serviceRequest?.id)
          }
        />
      ))}
    </Box>
  );
};
