import {
  Grid,
  Card,
  Chip,
  Typography,
  makeSxStyles,
  Button,
} from '@*company-data-covered*/design-system';
import {
  calculateAge,
  formattedDOB,
  getFullName,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  Visit,
  Patient,
  Episode,
} from '@*company-data-covered*/caremanager/data-access-types';

import { usePanelContext } from '../SidePanel';
import { VIRTUAL_APP_CARD_TEST_IDS } from './testIds';
import { CareTeam } from '../CareTeam';

export type VisitCardProps = {
  visit?: Visit;
  patient?: Patient;
  episode?: Episode;
  isAssignable?: boolean;
  isSidePanelOpen?: boolean;
};

const makeStyles = (selected: boolean) =>
  makeSxStyles({
    container: (theme) => ({
      backgroundColor: theme.palette.background.paper,
      borderRadius: 1,
      minWidth: '314px',
      boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.1)',
      outline: selected ? 'solid' : 'none',
      outlineColor: theme.palette.primary.main,
      outlineWidth: 4,
      marginBottom: 2,
    }),
    selectionContainer: {
      paddingTop: 1,
      '*': {
        cursor: 'pointer',
      },
    },
    section: {
      borderBottomColor: (theme) => theme.palette.divider,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      paddingX: 2,
      paddingY: 1,
    },
    title: {
      color: (theme) => theme.palette.primary.main,
      marginBottom: 0.5,
    },
    sectionSubtitle: {
      marginBottom: 1,
      marginTop: 0.5,
    },
    sectionText: {
      color: (theme) => theme.palette.text.secondary,
      display: 'flex',
    },
    patientDetails: {
      display: 'flex',
      gap: 1,
      marginBottom: 1,
    },
    bullet: {
      '::after': {
        content: '"\\2022"',
        marginLeft: 1,
        color: (theme) => theme.palette.text.disabled,
      },
    },
    marginRight: {
      marginRight: 1,
    },
    chip: {
      borderColor: (theme) => theme.palette.text.disabled,
      minWidth: '60px',
    },
  });

export const VisitCard = ({
  patient,
  visit,
  episode,
  isAssignable = false,
  isSidePanelOpen = false,
}: VisitCardProps) => {
  const { setSidePanelOpen } = usePanelContext();

  const styles = makeStyles(isSidePanelOpen);

  if (!visit || !patient || !episode) {
    return null;
  }

  const { id: visitId } = visit;

  const onSelectHandler = () => {
    if (visit.status !== 'scheduled' && visit.status !== 'available') {
      setSidePanelOpen(visitId, !isSidePanelOpen);
    }
  };

  return (
    <Card
      data-testid={VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)}
      sx={styles.container}
      onClick={onSelectHandler}
    >
      <Grid sx={styles.selectionContainer}>
        <Grid sx={styles.section}>
          <Typography variant="subtitle1" sx={styles.title}>
            {getFullName({
              firstName: patient.firstName,
              lastName: patient.lastName,
            })}
          </Typography>
          <Grid sx={styles.patientDetails}>
            {patient.athenaId && (
              <Typography sx={styles.bullet} variant="body2">
                MRN {patient.athenaId}
              </Typography>
            )}
            {patient.dateOfBirth && (
              <Typography sx={styles.bullet} variant="body2">
                {formattedDOB(patient.dateOfBirth)}
              </Typography>
            )}
            {patient.dateOfBirth && patient.sex && (
              <Typography variant="body2">
                {calculateAge(patient.dateOfBirth)}yo &nbsp;
                {sexStringToChar(patient.sex)}
              </Typography>
            )}
          </Grid>
          <Grid container spacing={1}>
            <Grid item>
              <Chip
                sx={styles.chip}
                label={episode.market?.tzName}
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip
                sx={styles.chip}
                label={`CR ${visit.careRequestId}`}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid sx={styles.section}>
          <Typography variant="subtitle2" sx={styles.sectionSubtitle}>
            Chief Complaint
          </Typography>
          <Typography variant="body2" sx={styles.sectionText}>
            {'TODO' || visit.typeId || 'None'}
          </Typography>
        </Grid>
        <Grid sx={styles.section}>
          <CareTeam
            carName={visit.carName || ''}
            firstName={visit.careRequestId || ''} // TODO: fetch shift team by care request id
            lastName={visit.careRequestId || ''} // TODO: fetch shift team by care request id
            phoneNumber={visit.careRequestId || ''} // TODO: fetch shift team by care request id
            status={visit.status}
          />
        </Grid>
        {isAssignable && (
          <Grid sx={styles.section}>
            <Button variant="contained" fullWidth>
              Assign to Me
            </Button>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};
