import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';

export const getListItem = (listType: string, name: string) =>
  `${listType}-${formatDataTestId(name)}-option`;
