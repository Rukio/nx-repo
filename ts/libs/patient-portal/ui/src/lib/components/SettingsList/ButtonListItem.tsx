import { FC } from 'react';
import { Button, ButtonProps, ListItem } from '@*company-data-covered*/design-system';
import { SETTINGS_LIST_TEST_IDS } from './testIds';

export type ButtonListItemProps = ButtonProps<'button'> & {
  testIdPrefix: string;
};

const ButtonListItem: FC<ButtonListItemProps> = ({
  testIdPrefix,
  ...buttonProps
}) => (
  <ListItem
    data-testid={SETTINGS_LIST_TEST_IDS.getButtonListItemRootTestId(
      testIdPrefix
    )}
    disablePadding
  >
    <Button
      data-testid={SETTINGS_LIST_TEST_IDS.getButtonListItemButtonTestId(
        testIdPrefix
      )}
      {...buttonProps}
    />
  </ListItem>
);

export default ButtonListItem;
