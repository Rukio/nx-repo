import {
  Box,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { DataRow } from './DataRow';

const styles = makeSxStyles({
  container: {
    padding: '16px',
  },
  column: {
    gap: '4px',
  },
});

type Props = {
  type?: string;
  name?: string;
  organization?: string;
  phoneNumber?: string;
  'data-testid'?: string;
};

export const Requester: React.FC<Props> = ({
  type,
  name,
  organization,
  phoneNumber,
  'data-testid': testId,
}) => {
  return (
    <Stack spacing={2} sx={styles.container} data-testid={testId}>
      <Typography variant="h6">Requester</Typography>
      <Box sx={styles.column}>
        <DataRow label="Type">{type}</DataRow>
        <DataRow label="Name">{name}</DataRow>
        <DataRow label="Organization">{organization}</DataRow>
        <DataRow label="Phone Number">{phoneNumber}</DataRow>
      </Box>
    </Stack>
  );
};
