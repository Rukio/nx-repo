import MuiTreeItem, {
  TreeItemProps as MuiTreeItemProps,
} from '@mui/lab/TreeItem';

export type TreeItemProps = MuiTreeItemProps;

const TreeItem = (props: TreeItemProps) => <MuiTreeItem {...props} />;

export default TreeItem;
