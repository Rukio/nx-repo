import { FC } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  useGetEpisodeVisits,
  useGetUsers,
} from '@*company-data-covered*/caremanager/data-access';
import {
  Visit,
  VisitListElement,
} from '@*company-data-covered*/caremanager/data-access-types';
import { assets } from '@*company-data-covered*/caremanager/ui';
import { VisitCard } from '../VisitCard';

const styles = makeSxStyles({
  listItem: { marginBottom: 1 },
  visitCardWrapper: {
    padding: '6px 0',
    width: '100%',
  },
  headerContainer: { marginBottom: 0.25 },
});

const LatestVisitsList: FC<{
  itemVisits: VisitListElement[];
  serviceLineName: string | undefined;
}> = ({ itemVisits, serviceLineName }) => {
  return (
    <List>
      {itemVisits.map((visit) => (
        <ListItem
          key={visit.id}
          disableGutters
          disablePadding
          sx={styles.listItem}
        >
          <Box sx={styles.visitCardWrapper}>
            <VisitCard
              key={visit.id}
              visit={visit}
              serviceLineName={serviceLineName}
            />
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export const LatestVisits: FC<{
  visit: Visit;
  episodeId: string;
  numberOfVisits: number;
  serviceLineName: string | undefined;
}> = ({ visit, episodeId, numberOfVisits, serviceLineName }) => {
  const { isLoading: isLoadingEpisodeVisit, data: episodeVisitsData } =
    useGetEpisodeVisits({
      episodeId: episodeId,
    });

  const latestItemsVisits = episodeVisitsData?.visits
    ?.filter((visitElement: VisitListElement) => {
      return visitElement.id !== visit.id;
    })
    .slice(0, numberOfVisits);

  const providerIds = latestItemsVisits
    ?.filter((v) => v.providerUserIds)
    .map((v) => v.providerUserIds)
    .flat() as string[] | undefined;
  useGetUsers(providerIds);

  if (isLoadingEpisodeVisit) {
    return (
      <Box
        width="100%"
        height="500px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={styles.headerContainer}>
        <Grid
          container
          spacing={2}
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Grid item>
            <Typography variant="subtitle2" fontSize={16}>
              Latest Visits
            </Typography>
          </Grid>
          <Grid item>
            <Button href={`/episodes/${episodeId}/visits`} variant="outlined">
              {`See All Episode's Visits`}
            </Button>
          </Grid>
        </Grid>
      </Box>
      {latestItemsVisits?.length ? (
        <LatestVisitsList
          itemVisits={latestItemsVisits}
          serviceLineName={serviceLineName}
        />
      ) : (
        <Box>
          <Typography align="center">
            <img alt="empty" src={assets.quill} />
          </Typography>
          <Typography align="center">
            There are no previous visits in this Episode
          </Typography>
        </Box>
      )}
    </Box>
  );
};
