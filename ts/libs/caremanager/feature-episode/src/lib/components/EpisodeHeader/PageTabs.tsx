import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleOutlineIcon,
  CommentIcon,
  DirectionsCarIcon,
  NotesIcon,
} from '@*company-data-covered*/design-system';
import { Tab, Tabs } from '@*company-data-covered*/caremanager/ui';

type TabTypes = 'overview' | 'tasks' | 'notes';
type IconLibraryTypes = 'note' | 'check' | 'comment';

type TabProps = {
  value: string;
  icon: string;
  pendingTasks?: number;
  route: string;
};

type PageTabsProps = {
  tabs: TabProps[];
  currentTab: TabTypes;
  onTabChange: (
    element: React.SyntheticEvent<Element, Event>,
    tab: TabTypes
  ) => void;
};

const ICONS_LIBRARY = {
  car: DirectionsCarIcon,
  check: CheckCircleOutlineIcon,
  comment: CommentIcon,
  note: NotesIcon,
};

const getTabLabel = (value: string, pendingTasks: number | undefined) => {
  const extraText = pendingTasks ? `(${pendingTasks})` : '';

  return `${value} ${extraText}`;
};

const PageTabs: React.FC<PageTabsProps> = ({
  tabs,
  currentTab,
  onTabChange,
}) => (
  <Tabs value={currentTab} onChange={onTabChange} data-testid="tabs-component">
    {tabs.map((tab) => {
      const Icon = ICONS_LIBRARY[tab.icon as IconLibraryTypes];
      const otherProps = {
        to: tab.route,
        replace: true,
      };

      return (
        <Tab
          icon={<Icon />}
          value={tab.route}
          label={getTabLabel(tab.value, tab.pendingTasks)}
          iconPosition="start"
          key={tab.value}
          LinkComponent={Link}
          {...otherProps}
          data-testid={`episode-${tab.value.toLowerCase()}-tab`}
        />
      );
    })}
  </Tabs>
);

export default PageTabs;
