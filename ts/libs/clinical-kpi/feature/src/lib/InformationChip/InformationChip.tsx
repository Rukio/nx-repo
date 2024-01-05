import {
  Chip,
  InfoIcon,
  Tooltip,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

export enum ChipState {
  YES = 'Yes',
  NO = 'No',
}

export enum ChipActiveColor {
  RED = 'error.main',
  GREEN = 'info.main',
}

export type InformationChipProps = {
  chipState: ChipState;
  activeColor: ChipActiveColor;
  text?: string;
  dataTestId?: string;
};

const makeStyles = (activeColor: string) =>
  makeSxStyles({
    chipEnabled: {
      color: 'common.white',
      backgroundColor: activeColor,

      '&:hover': {
        cursor: 'pointer',
      },
    },
    chipDisabled: {
      color: 'common.black',
      backgroundColor: '#f0ecec',

      '&:hover': {
        cursor: 'default',
      },
    },
    chipIcon: {
      color: '#fff !important',
      opacity: 0.7,
    },
    chipPopper: {
      '& .MuiTooltip-tooltip': {
        backgroundColor: '#616161e6',
        padding: '16px 8px',
      },
      '& .MuiTooltip-arrow': {
        color: '#616161e6',
      },
    },
  });

export const InformationChip = ({
  chipState,
  activeColor,
  text,
  dataTestId = 'information-chip',
}: InformationChipProps) => {
  const styles = makeStyles(activeColor);

  const isChipEnabled = chipState === ChipState.YES;
  // NO-OP: the stubbed function is needed to alter the default location of the Chip icon
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onDeleteStub = () => {};

  return (
    <Tooltip
      title={text}
      arrow={true}
      PopperProps={{
        sx: styles.chipPopper,
      }}
    >
      <Chip
        deleteIcon={<InfoIcon sx={styles.chipIcon} />}
        sx={isChipEnabled ? styles.chipEnabled : styles.chipDisabled}
        onDelete={isChipEnabled ? onDeleteStub : undefined}
        label={chipState}
        data-testid={dataTestId}
      />
    </Tooltip>
  );
};

export default InformationChip;
