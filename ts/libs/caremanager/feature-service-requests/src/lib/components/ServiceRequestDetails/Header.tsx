import { useGetServiceRequestNotes } from '@*company-data-covered*/caremanager/data-access';
import { StationPatient } from '@*company-data-covered*/caremanager/data-access-types';
import {
  calculateAge,
  formattedDOB,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  Box,
  CircularProgress,
  CloseIcon,
  IconButton,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { MarketChip } from '../MarketChip';
import { NotesChip } from '../NotesChip';
import { AccentSection } from './AccentSection';

const styles = makeSxStyles({
  container: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  closeIcon: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
  },
  chip: {
    borderColor: (theme) => theme.palette.text.disabled,
  },
});

type Props = {
  patient?: StationPatient;
  marketId?: string;
  serviceRequestId: string;
  onClose?: () => void;
  'data-testid'?: string;
};

export const Header: React.FC<Props> = ({
  patient,
  serviceRequestId,
  marketId,
  onClose,
  'data-testid': testId,
}) => {
  const { data } = useGetServiceRequestNotes(serviceRequestId);

  if (!patient) {
    return <CircularProgress />;
  }

  const fullName =
    patient.firstName &&
    patient.lastName &&
    `${patient.firstName} ${patient.lastName}`;

  return (
    <AccentSection sx={styles.container} data-testid={testId}>
      <Box sx={styles.content}>
        <Typography variant="h5">
          {fullName || 'Missing patient name'}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          divider={<Box color={(theme) => theme.palette.text.disabled}>•</Box>}
        >
          <Typography variant="body2">
            {`MRN ${patient.ehrId || '-'}`}
          </Typography>
          <Typography variant="body2">
            {formattedDOB(patient.dateOfBirth)}
          </Typography>
          <Typography variant="body2">
            {`${calculateAge(patient.dateOfBirth)}yo ${
              patient.sex ? sexStringToChar(patient.sex) : ''
            }`}
          </Typography>
          <Typography variant="body2">{patient.phoneNumber || '-'}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <MarketChip sx={styles.chip} marketId={marketId} />
          <NotesChip sx={styles.chip} count={data?.notes.length.toString()} />
        </Stack>
      </Box>
      <IconButton aria-label="close" onClick={onClose} sx={styles.closeIcon}>
        <CloseIcon />
      </IconButton>
    </AccentSection>
  );
};
