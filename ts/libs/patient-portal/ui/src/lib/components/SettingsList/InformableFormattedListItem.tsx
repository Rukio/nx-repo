import { FC } from 'react';
import { InfoOutlinedIcon } from '@*company-data-covered*/design-system';
import {
  FormattedListItem,
  FormattedListItemIconButton,
  FormattedListItemIconButtonProps,
  FormattedListItemProps,
} from '../FormattedList';

export type InformableFormattedListItemProps = Pick<
  FormattedListItemIconButtonProps,
  'onClick'
> &
  FormattedListItemProps;

const InformableFormattedListItem: FC<InformableFormattedListItemProps> = ({
  onClick,
  testIdPrefix,
  ...props
}) => {
  const infoButton = (
    <FormattedListItemIconButton
      color="info"
      IconElement={InfoOutlinedIcon}
      onClick={onClick}
      testIdPrefix={testIdPrefix}
    />
  );

  return (
    <FormattedListItem
      action={infoButton}
      testIdPrefix={testIdPrefix}
      {...props}
    />
  );
};

export default InformableFormattedListItem;
