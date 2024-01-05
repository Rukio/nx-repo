import { FC, PropsWithChildren } from 'react';
import {
  makeSxStyles,
  Drawer as BaseDrawer,
  DrawerProps as BaseDrawerProps,
} from '@*company-data-covered*/design-system';
import { DRAWER_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      p: theme.spacing(3, 2),
      borderTopLeftRadius: theme.spacing(1),
      borderTopRightRadius: theme.spacing(1),
    }),
  });

export type DrawerProps = PropsWithChildren<
  BaseDrawerProps & {
    testIdPrefix: string;
  }
>;

const Drawer: FC<DrawerProps> = ({ children, testIdPrefix, ...props }) => {
  const styles = makeStyles();

  return (
    <BaseDrawer
      data-testid={DRAWER_TEST_IDS.getDrawerTestId(testIdPrefix)}
      anchor="bottom"
      PaperProps={{
        sx: styles.root,
      }}
      {...props}
    >
      {children}
    </BaseDrawer>
  );
};

export default Drawer;
