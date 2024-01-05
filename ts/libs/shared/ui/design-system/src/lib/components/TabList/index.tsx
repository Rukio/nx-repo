import MuiTabList, { TabListProps as MuiTabListProps } from '@mui/lab/TabList';

export type TabListProps = MuiTabListProps;

const TabList = (props: TabListProps) => <MuiTabList {...props} />;

export default TabList;
