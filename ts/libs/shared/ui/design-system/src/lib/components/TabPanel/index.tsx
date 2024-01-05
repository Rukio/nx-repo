import MuiTabPanel, {
  TabPanelProps as MuiTabPanelProps,
} from '@mui/lab/TabPanel';

export type TabPanelProps = MuiTabPanelProps;

const TabPanel = (props: TabPanelProps) => <MuiTabPanel {...props} />;

export default TabPanel;
