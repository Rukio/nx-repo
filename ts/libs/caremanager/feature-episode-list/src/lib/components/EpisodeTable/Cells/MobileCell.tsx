import { FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Link,
  Stack,
  TableCell,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  abridgedText,
  calculateAge,
  calculateDays,
  getFullName,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  Episode,
  ServiceLine,
} from '@*company-data-covered*/caremanager/data-access-types';

const MAX_TEXT_LENGTH = 70;

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
});

type Props = {
  episode: Episode;
  serviceLine?: ServiceLine;
};

const MobileCell: FC<Props> = ({
  episode: { carePhase, patientSummary, patient, admittedAt, id },
  serviceLine,
}) => {
  const patientName = patient ? getFullName(patient) : 'Missing patient name';
  const patientAgeAndSex = patient
    ? `${calculateAge(patient.dateOfBirth)}yo ${sexStringToChar(patient.sex)}`
    : 'Missing patient age and sex';
  const lengthOfStay = calculateDays(new Date(admittedAt), new Date());
  const linkProps = {
    to: `/episodes/${id}/overview`,
    component: RouterLink,
  };

  return (
    <TableCell data-testid={`episode-mobile-cell-${id}`}>
      <Stack direction="row" spacing={1}>
        <Typography variant="subtitle2">
          <Link sx={styles.link} {...linkProps}>
            {patientName}
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {patientAgeAndSex}
        </Typography>
      </Stack>
      {serviceLine?.name && carePhase?.name && (
        <Typography variant="body2" color="text.secondary">
          {`${serviceLine.name}, ${carePhase.name}, LOS ${lengthOfStay}d`}
        </Typography>
      )}
      <Box paddingTop={1}>
        {patientSummary ? abridgedText(patientSummary, MAX_TEXT_LENGTH) : '--'}
      </Box>
    </TableCell>
  );
};

export default MobileCell;
