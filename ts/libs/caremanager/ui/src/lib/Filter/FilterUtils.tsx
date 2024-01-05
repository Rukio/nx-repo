import { FC } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { sortByName } from '@*company-data-covered*/caremanager/utils';

type Filter = {
  longName: string;
  shortName: string;
  id: string;
};

const makeStyles = (itemName: string) =>
  makeSxStyles({
    colorIndicator: {
      backgroundColor: (theme) => {
        const carePhaseColorMap = {
          Pending: theme.palette.primary.main,
          'High Acuity': theme.palette.error.main,
          'Transition - High': theme.palette.warning.main,
          'Transition - Low': theme.palette.text.primary,
          Discharged: theme.palette.grey[400],
          Closed: theme.palette.text.primary,
          Active: theme.palette.success.main,
        };

        return (
          carePhaseColorMap[itemName as keyof typeof carePhaseColorMap] ||
          theme.palette.success.main
        );
      },
    },
  });

export const removeItem = (
  id: string,
  setSelectedItems: (_: string[]) => void,
  selectedItems: string[]
) => {
  setSelectedItems(selectedItems.filter((_id) => id !== _id));
};

export const removeItems = (
  ids: string[],
  setSelectedItems: (_: string[]) => void,
  selectedItems: string[]
) => {
  setSelectedItems(selectedItems.filter((_id) => !ids.includes(_id)));
};

export const createFilterLabelFromSelectedItems = (
  selectedItems: Filter[]
): string => {
  const shortLabels = selectedItems.map((item) => item.shortName).join(', ');

  return shortLabels.length > 32
    ? `${shortLabels.substring(0, 26)}, ...`
    : shortLabels;
};

type FilterCheckboxProps = {
  filter: Filter;
  setSelectedItems: (_: string[]) => void;
  selectedItems: string[];
  listDecoration?: boolean;
};

export const FilterCheckbox: FC<FilterCheckboxProps> = ({
  filter,
  setSelectedItems,
  selectedItems,
  listDecoration,
}) => {
  const styles = makeStyles(filter.longName);

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={selectedItems.includes(filter.id)}
          onClick={() =>
            selectedItems.includes(filter.id)
              ? removeItem(filter.id, setSelectedItems, selectedItems)
              : setSelectedItems([...selectedItems, filter.id])
          }
        />
      }
      label={
        <Stack direction="row" alignItems="center">
          {listDecoration && (
            <Box
              component="span"
              borderRadius="50%"
              marginRight={1}
              height={6}
              width={6}
              sx={styles.colorIndicator}
            />
          )}
          {filter.longName}
        </Stack>
      }
      key={filter.longName}
      value={filter.longName}
    />
  );
};

export const sortItems = (
  items: Array<{ name: string; id: string; shortName?: string }> = []
): Filter[] => {
  if (items) {
    const sortedItems = sortByName(items);
    if (sortedItems) {
      return sortedItems.map((item) => ({
        shortName: item.shortName ?? item.name,
        longName: item.name,
        id: item.id,
      }));
    }
  }

  return [];
};
