import { MenuItem } from '@*company-data-covered*/design-system';
import { FormMenuItem } from '../../types';

import { FORM_SELECT_MENU_ITEM_TEST_IDS } from './testIds';

/**
 * A utility function to render a simple MenuItem list
 *
 * @example
 * ```typescript
 * const items: FormMenuItem[] = [
 *   { label: 'label 1', value: 'value 1' },
 *   { label: 'label 2', value: 'value 2' },
 *   { label: 'label 3', value: 'value 3' },
 * ];
 * const dataTestIdPrefix = 'form-select-menu-item';
 *
 * return (
 *   <FormSelect {...formSelectProps}>
 *     {getFormSelectMenuItems(items, dataTestIdPrefix)}
 *   </FormSelect>
 * );
 * ```
 *
 * @param items - an array of FormMenuItem objects to generate MenuItem list
 * @param dataTestIdPrefix - optional parameter, set as a common prefix in the generation of data-testid for all list items
 * @returns an array of MenuItem components with a default view
 */

export const getFormSelectMenuItems = (
  items: FormMenuItem[],
  dataTestIdPrefix?: string
) =>
  items.map((item) => (
    <MenuItem
      {...item}
      key={item.value}
      data-testid={
        dataTestIdPrefix &&
        FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
          dataTestIdPrefix,
          item.value
        )
      }
    >
      {item.label}
    </MenuItem>
  ));
