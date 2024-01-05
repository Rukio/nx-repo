import MuiTabContext, {
  TabContextProps as MuiTabContextProps,
} from '@mui/lab/TabContext';

export type TabContextProps = MuiTabContextProps;

const TabContext = (props: TabContextProps) => <MuiTabContext {...props} />;

export default TabContext;
