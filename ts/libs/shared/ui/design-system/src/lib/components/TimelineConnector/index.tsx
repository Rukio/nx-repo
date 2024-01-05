import MuiTimelineConnector, {
  TimelineConnectorProps as MuiTimelineConnectorProps,
} from '@mui/lab/TimelineConnector';

export type TimelineConnectorProps = MuiTimelineConnectorProps;

const TimelineConnector = (props: TimelineConnectorProps) => (
  <MuiTimelineConnector {...props} />
);

export default TimelineConnector;
