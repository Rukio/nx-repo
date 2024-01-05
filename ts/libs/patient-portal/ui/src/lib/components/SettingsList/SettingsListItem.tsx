import InformableFormattedListItem, {
  InformableFormattedListItemProps,
} from './InformableFormattedListItem';
import EditableFormattedListItem, {
  EditableFormattedListItemProps,
} from './EditableFormattedListItem';

export type SettingsListItemProps<Editable extends true | false> =
  (Editable extends true
    ? Omit<EditableFormattedListItemProps, 'onClick'>
    : Omit<InformableFormattedListItemProps, 'onClick'>) & {
    editable?: Editable;
    onEdit?: EditableFormattedListItemProps['onClick'];
    onInfo?: InformableFormattedListItemProps['onClick'];
  };

const SettingsListItem = <T extends boolean>({
  editable,
  onEdit,
  onInfo,
  ...props
}: SettingsListItemProps<T>) => {
  const Component = editable
    ? EditableFormattedListItem
    : InformableFormattedListItem;

  const onClick = editable ? onEdit : onInfo;

  return <Component {...props} onClick={onClick} />;
};

export default SettingsListItem;
