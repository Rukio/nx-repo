import { useMemo, useState } from 'react';
import {
  Grid,
  Tab,
  TabContext,
  Tabs,
  TabPanel,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetVirtualAppVisits } from '@*company-data-covered*/caremanager/data-access';
import { Filter } from '@*company-data-covered*/caremanager/ui';
import {
  HEADER_HEIGHT,
  UNASSIGNED_VISITS_WIDTH,
} from '@*company-data-covered*/caremanager/utils';

import { AvailableVisitsTabPanel } from './AvailableVisitsTabPanel';
import { ScheduledVisitsTabPanel } from './ScheduledVisitsTabPanel';
import { UNASSIGNED_VISITS_TEST_IDS } from './testIds';

export enum UnassignedVisitsTabNames {
  ScheduledVisits = 'ScheduledVisits',
  AvailableVisits = 'AvailableVisits',
}

const styles = makeSxStyles({
  outerContainer: {
    width: UNASSIGNED_VISITS_WIDTH,
    height: `calc(100vh - ${HEADER_HEIGHT})`,
  },
  innerContainer: {
    flexDirection: 'column',
    height: '100%',
    borderRight: '1px solid',
    borderColor: (theme) => theme.palette.divider,
    backgroundColor: (theme) => theme.palette.common.white,
  },
  padding: {
    p: 2.5,
  },
  filters: {
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    borderBottom: '1px solid',
    borderColor: (theme) => theme.palette.divider,
  },
  tab: {
    width: '50%',
  },
  tabPanel: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: (theme) => theme.palette.grey[200],
  },
});

export const UnassignedVisitsSection = () => {
  const [selectedTab, setSelectedTab] = useState<UnassignedVisitsTabNames>(
    UnassignedVisitsTabNames.ScheduledVisits
  );

  // TODO: PE-2563 - provide real props to the BE endpoint
  const { data: virtualAppVisits } = useGetVirtualAppVisits({
    shiftTeamId: '123',
    userId: '12839031',
    marketIds: ['198'],
  });

  const scheduledVirtualVisits = useMemo(
    () => virtualAppVisits?.scheduled,
    [virtualAppVisits?.scheduled]
  );

  const availableVirtualVisits = useMemo(
    () => virtualAppVisits?.available,
    [virtualAppVisits?.available]
  );

  const onTabChange = (_: unknown, v: UnassignedVisitsTabNames) =>
    setSelectedTab(v);

  const onMarketFilterSelected = (_markets: string[]) => {
    // TODO: PE-2513 - apply filtering logic once we connect this component to BE
  };

  const onCarFilterSelected = (_cars: string[]) => {
    // TODO: PE-2513 - apply filtering logic once we connect this component to BE
  };

  return (
    <Grid
      sx={styles.outerContainer}
      data-testid={UNASSIGNED_VISITS_TEST_IDS.CONTAINER}
    >
      <Grid container sx={styles.innerContainer}>
        <Grid
          item
          sx={[styles.padding, styles.divider]}
          data-testid={UNASSIGNED_VISITS_TEST_IDS.HEADER}
        >
          <Typography variant="h6">Unassigned Visits</Typography>
        </Grid>
        <Grid
          container
          sx={[styles.filters, styles.padding]}
          data-testid={UNASSIGNED_VISITS_TEST_IDS.FILTERS}
        >
          <Typography variant="body2">Filter by</Typography>
          <Filter
            items={[]}
            testid="market"
            defaultLabel="Markets"
            selectedIds={[]}
            setSelectedIds={onMarketFilterSelected}
            isSearchable
          />
          <Filter
            items={[]}
            testid="cars"
            defaultLabel="Cars"
            selectedIds={[]}
            setSelectedIds={onCarFilterSelected}
            isSearchable
          />
        </Grid>
        <TabContext value={selectedTab}>
          <Tabs
            sx={styles.divider}
            value={selectedTab}
            onChange={onTabChange}
            data-testid={UNASSIGNED_VISITS_TEST_IDS.TAB_SWITCH}
          >
            <Tab
              sx={styles.tab}
              label="Scheduled Visits"
              value={UnassignedVisitsTabNames.ScheduledVisits}
              data-testid={UNASSIGNED_VISITS_TEST_IDS.TAB_SCHEDULED_VISITS}
            />
            <Tab
              sx={styles.tab}
              label="Available Visits"
              value={UnassignedVisitsTabNames.AvailableVisits}
              data-testid={UNASSIGNED_VISITS_TEST_IDS.TAB_AVAILABLE_VISITS}
            />
          </Tabs>
          <TabPanel
            sx={styles.tabPanel}
            value={UnassignedVisitsTabNames.ScheduledVisits}
          >
            <ScheduledVisitsTabPanel scheduledVisits={scheduledVirtualVisits} />
          </TabPanel>
          <TabPanel
            sx={styles.tabPanel}
            value={UnassignedVisitsTabNames.AvailableVisits}
          >
            <AvailableVisitsTabPanel availableVisits={availableVirtualVisits} />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  );
};
