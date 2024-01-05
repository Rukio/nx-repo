import { FC } from 'react';
import {
  Button,
  ButtonProps,
  ButtonTypeMap,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    button: {
      lineHeight: 'inherit',
      minWidth: 0,
      padding: 0,
      verticalAlign: 'top',
    },
  });

export type FormattedListItemButtonProps<
  D extends React.ElementType = ButtonTypeMap['defaultComponent'],
  P = object
> = ButtonProps<D, P> & {
  testIdPrefix: string;
};

const FormattedListItemButton: FC<FormattedListItemButtonProps> = ({
  testIdPrefix,
  variant = 'text',
  ...props
}) => {
  const styles = makeStyles();

  return (
    <Button
      data-testid={FORMATTED_LIST_TEST_IDS.getListItemButtonTestId(
        testIdPrefix
      )}
      sx={styles.button}
      variant={variant}
      {...props}
    />
  );
};

export default FormattedListItemButton;
