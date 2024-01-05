import { MenuItemProps } from '@*company-data-covered*/design-system';
import { DataDogPrivacyAttributes } from '@*company-data-covered*/shared/datadog/util';

export type FormComponentProps = DataDogPrivacyAttributes & {
  'data-testid'?: string;
};

export type FormMenuItem = MenuItemProps &
  FormComponentProps & {
    value: string;
    label: string;
  };
