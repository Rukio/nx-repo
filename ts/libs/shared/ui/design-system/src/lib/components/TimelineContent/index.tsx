import MuiTimelineContent, {
  TimelineContentProps as MuiTimelineContentProps,
} from '@mui/lab/TimelineContent';

export type TimelineContentProps = MuiTimelineContentProps;

const TimelineContent = (props: TimelineContentProps) => (
  <MuiTimelineContent {...props} />
);

export default TimelineContent;
