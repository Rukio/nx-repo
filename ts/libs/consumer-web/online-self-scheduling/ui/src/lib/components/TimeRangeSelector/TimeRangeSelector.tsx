import {
  Box,
  FormControl,
  makeSxStyles,
  Typography,
  InputAdornment,
  CircularProgress,
  selectClasses,
  menuClasses,
} from '@*company-data-covered*/design-system';
import { TIME_RANGE_SELECTOR_TEST_IDS } from './testIds';
import {
  FormSelect,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import { Control, FieldValue, FieldValues } from 'react-hook-form';

const makeStyles = () =>
  makeSxStyles({
    container: {
      mt: 3,
    },
    timeRangeSelect: {
      mt: 1,
      [`& .${selectClasses.icon}`]: {
        position: 'relative',
      },
    },
    timePickerMenu: {
      [`& .${menuClasses.paper}`]: {
        maxHeight: '350px',
      },
    },
  });

export interface TimeRangeSelectorProps<TFieldValues extends FieldValues> {
  title?: string;
  formFieldName: string;
  timeSelectList: {
    label: string;
    value: string;
  }[];
  dataTestIdPrefix?: string;
  isLoading?: boolean;
  formControl: Control<TFieldValues>;
}

const TimeRangeSelector = <TFieldValues extends FieldValues>({
  title,
  formFieldName,
  timeSelectList,
  dataTestIdPrefix = 'time-range-selector',
  isLoading,
  formControl,
}: TimeRangeSelectorProps<TFieldValues>) => {
  const styles = makeStyles();

  return (
    <Box sx={styles.container}>
      {title && (
        <Typography
          variant="h6"
          data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(
            dataTestIdPrefix
          )}
        >
          {title}
        </Typography>
      )}
      <FormControl fullWidth>
        <FormSelect
          name={formFieldName as FieldValue<TFieldValues>}
          control={formControl}
          selectProps={{
            fullWidth: true,
            name: formFieldName,
            'data-testid':
              TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(dataTestIdPrefix),
            inputProps: {
              'data-testid':
                TIME_RANGE_SELECTOR_TEST_IDS.getInputTestId(dataTestIdPrefix),
            },
            MenuProps: {
              sx: styles.timePickerMenu,
            },
            sx: styles.timeRangeSelect,
            disabled: isLoading,
            endAdornment: isLoading && (
              <InputAdornment position="end">
                <CircularProgress
                  size={20}
                  data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getCircularProgressTestId(
                    dataTestIdPrefix
                  )}
                />
              </InputAdornment>
            ),
          }}
        >
          {getFormSelectMenuItems(
            timeSelectList,
            TIME_RANGE_SELECTOR_TEST_IDS.getMenuItemTestIdPrefix(
              dataTestIdPrefix
            )
          )}
        </FormSelect>
      </FormControl>
    </Box>
  );
};

export default TimeRangeSelector;
