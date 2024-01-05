import MuiTimelineItem, {
  TimelineItemProps as MuiTimelineItemProps,
} from '@mui/lab/TimelineItem';

export type TimelineItemProps = MuiTimelineItemProps;

const TimelineItem = (props: TimelineItemProps) => (
  <MuiTimelineItem {...props} />
);

export default TimelineItem;
