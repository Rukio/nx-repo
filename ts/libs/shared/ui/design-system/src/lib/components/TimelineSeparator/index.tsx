import MuiTimelineSeparator, {
  TimelineSeparatorProps as MuiTimelineSeparatorProps,
} from '@mui/lab/TimelineSeparator';

export type TimelineSeparatorProps = MuiTimelineSeparatorProps;

const TimelineSeparator = (props: TimelineSeparatorProps) => (
  <MuiTimelineSeparator {...props} />
);

export default TimelineSeparator;
