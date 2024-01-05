import { FC } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  ArrowDropDownIcon,
  Grid,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { VirtualAPPVisit } from '@*company-data-covered*/caremanager/data-access-types';
import { VisitCard } from '../../VisitCard';
import { usePanelContext } from '../../SidePanel';
import { VISITS_ACCORDION_TEST_IDS } from '../testIds';

export type VisitsAccordionProps = {
  header: string;
  visits?: VirtualAPPVisit[];
  defaultExpanded?: boolean;
  testIdPrefix?: string;
};

const styles = makeSxStyles({
  container: {
    padding: 3,
    backgroundColor: (theme) => theme.palette.background.default,
    boxShadow: 'none',
  },
  accordionSummary: {
    flexDirection: 'row-reverse',
  },
  accordionExpandIcon: {
    fontSize: '2rem',
  },
});

export const VisitsAccordion: FC<VisitsAccordionProps> = ({
  visits,
  header,
  defaultExpanded = false,
  testIdPrefix = '',
}) => {
  const { selectedVisitId } = usePanelContext();

  return (
    <Accordion
      data-testid={VISITS_ACCORDION_TEST_IDS.ROOT(testIdPrefix)}
      disableGutters
      defaultExpanded={defaultExpanded}
      square
      sx={styles.container}
    >
      <AccordionSummary
        sx={styles.accordionSummary}
        expandIcon={<ArrowDropDownIcon sx={styles.accordionExpandIcon} />}
        data-testid={VISITS_ACCORDION_TEST_IDS.HEADER(testIdPrefix)}
      >
        <Typography
          data-testid={VISITS_ACCORDION_TEST_IDS.TITLE(testIdPrefix)}
          variant="h5"
        >
          {header}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {visits && (
          <Grid container spacing={2}>
            {visits.map(({ visit, patient, episode }) => (
              <Grid key={visit?.id} item md={12} lg={6} xl={4}>
                <VisitCard
                  visit={visit}
                  patient={patient}
                  episode={episode}
                  isSidePanelOpen={selectedVisitId === visit?.id.toString()}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
