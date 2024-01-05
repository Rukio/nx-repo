import MuiTreeView, {
  TreeViewProps as MuiTreeViewProps,
} from '@mui/lab/TreeView';

export type TreeViewProps = MuiTreeViewProps;

const TreeView = (props: TreeViewProps) => <MuiTreeView {...props} />;

export default TreeView;
