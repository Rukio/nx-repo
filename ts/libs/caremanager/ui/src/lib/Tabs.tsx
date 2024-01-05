import { FC } from 'react';
import {
  Tab as DSTab,
  Tabs as DSTabs,
  TabProps,
  TabsProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  tabs: {
    '& .MuiTabs-scroller': {
      xs: {
        overflow: 'auto !important',
        '::-webkit-scrollbar': {
          height: 0,
        },
      },
      md: {
        overflow: 'hidden',
      },
    },
  },
  tab: {
    minWidth: 'unset',
    minHeight: 48,
    padding: 0,
    marginRight: 3,
  },
});

export const Tabs: FC<TabsProps> = (props) => (
  <DSTabs sx={{ ...styles.tabs, ...props.sx }} {...props} />
);

export const Tab: FC<TabProps> = (props) => (
  <DSTab sx={{ ...styles.tab, ...props.sx }} {...props} />
);
