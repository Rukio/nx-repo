import { FC } from 'react';
import { useTheme } from '@*company-data-covered*/design-system';

import { Meta } from '@storybook/react';
import ProgressBar from '../index';

export default {
  title: 'Components/ProgressBar',
  component: ProgressBar,
} as Meta<typeof ProgressBar>;

export const BasicProgressBar: FC = () => {
  const theme = useTheme();

  return (
    <ProgressBar
      color={theme.palette.success.light}
      count={7}
      text="You cared for 7 patients"
    />
  );
};

export const NoTextProgressBar: FC = () => {
  const theme = useTheme();

  return <ProgressBar color={theme.palette.success.light} count={7} />;
};
