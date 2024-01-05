import { FC } from 'react';
import {
  Chip,
  Stack,
  SxStylesValue,
  TableCell,
  Theme,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { calculateDays } from '@*company-data-covered*/caremanager/utils';
import {
  Episode,
  ServiceLine,
} from '@*company-data-covered*/caremanager/data-access-types';

const getChipColorProps = (carePhase: string) => {
  const phaseStyleMap = {
    Pending: {
      backgroundColor: (theme: Theme) => theme.palette.primary.main,
      color: (theme: Theme) => theme.palette.secondary.contrastText,
    },
    'High Acuity': {
      backgroundColor: (theme: Theme) => theme.palette.error.main,
      color: (theme: Theme) => theme.palette.secondary.contrastText,
    },
    'Transition - High': {
      backgroundColor: (theme: Theme) => theme.palette.warning.main,
      color: (theme: Theme) => theme.palette.secondary.contrastText,
    },
    Discharged: {
      backgroundColor: (theme: Theme) => theme.palette.secondary.main,
      color: (theme: Theme) => theme.palette.secondary.contrastText,
    },
    Closed: {
      backgroundColor: (theme: Theme) => theme.palette.action.selected,
      color: (theme: Theme) => theme.palette.text.primary,
    },
    Active: {
      backgroundColor: (theme: Theme) => theme.palette.success.main,
      color: (theme: Theme) => theme.palette.secondary.contrastText,
    },
  };

  return Object.prototype.hasOwnProperty.call(phaseStyleMap, carePhase)
    ? phaseStyleMap[carePhase as keyof typeof phaseStyleMap]
    : phaseStyleMap.Closed;
};

const makeStyles = (carePhase = '') =>
  makeSxStyles({
    chip: { marginBottom: '4px', ...getChipColorProps(carePhase) },
  });

type Props = {
  episode: Episode;
  serviceLine?: ServiceLine;
  containerStyles: SxStylesValue;
};

const DetailsCell: FC<Props> = ({ episode, serviceLine, containerStyles }) => {
  const { id, carePhase, admittedAt, dischargedAt } = episode;
  const lengthOfStay = calculateDays(
    new Date(admittedAt),
    dischargedAt ? new Date(dischargedAt) : new Date()
  );

  const styles = makeStyles(carePhase?.name);

  return (
    <TableCell data-testid={`episode-details-cell-${id}`} sx={containerStyles}>
      <Typography variant="body2" marginBottom={0.5}>
        {serviceLine?.name || 'Unknown service line'}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <Chip
          label={carePhase?.name || 'Unknown care phase'}
          size="small"
          sx={styles.chip}
          data-testid={`status-dot-${id}`}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {`LOS ${lengthOfStay}d`}
      </Typography>
    </TableCell>
  );
};

export default DetailsCell;
