import { FC, ReactElement } from 'react';
import {
  IconButton,
  IconButtonProps,
  SvgIconProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    button: {
      minWidth: 0,
      padding: 0,
    },
  });

export type FormattedListItemIconButtonProps = IconButtonProps & {
  IconElement: (props: SvgIconProps) => ReactElement;
  testIdPrefix: string;
};

const FormattedListItemIconButton: FC<FormattedListItemIconButtonProps> = ({
  IconElement,
  testIdPrefix,
  ...props
}) => {
  const styles = makeStyles();

  return (
    <IconButton
      data-testid={FORMATTED_LIST_TEST_IDS.getListItemIconButtonTestId(
        testIdPrefix
      )}
      sx={styles.button}
      {...props}
    >
      <IconElement />
    </IconButton>
  );
};

export default FormattedListItemIconButton;
