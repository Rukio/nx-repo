import MuiTimelineDot, {
  TimelineDotProps as MuiTimelineDotProps,
} from '@mui/lab/TimelineDot';

export type TimelineDotProps = MuiTimelineDotProps;

const TimelineDot = (props: TimelineDotProps) => <MuiTimelineDot {...props} />;

export default TimelineDot;
