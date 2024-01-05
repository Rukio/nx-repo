import { FC } from 'react';
import {
  FormattedListItem,
  FormattedListItemProps,
  FormattedListItemButton,
  FormattedListItemButtonProps,
} from '../FormattedList';

export type EditableFormattedListItemProps = Pick<
  FormattedListItemButtonProps,
  'onClick'
> &
  FormattedListItemProps;

const EditableFormattedListItem: FC<EditableFormattedListItemProps> = ({
  onClick,
  testIdPrefix,
  ...props
}) => {
  const editButton = (
    <FormattedListItemButton onClick={onClick} testIdPrefix={testIdPrefix}>
      Edit
    </FormattedListItemButton>
  );

  return (
    <FormattedListItem
      action={editButton}
      testIdPrefix={testIdPrefix}
      {...props}
    />
  );
};

export default EditableFormattedListItem;
