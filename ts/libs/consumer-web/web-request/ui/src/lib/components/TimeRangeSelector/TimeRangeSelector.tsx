import { FC } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  makeSxStyles,
  SelectChangeEvent,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@*company-data-covered*/design-system';
import { TIME_RANGE_SELECTOR_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    timeRangeSelect: {
      mt: 1,
      '& .MuiSelect-icon': {
        position: 'relative',
      },
    },
    timePickerMenu: {
      '& .MuiMenu-paper': {
        maxHeight: '350px',
      },
    },
  });

export interface TimeSlot {
  label: string;
  value: string;
}

export interface TimeRangeSelectorProps {
  title: string;
  name: string;
  value: string;
  timeSelectList: TimeSlot[];
  dataTestIdPrefix?: string;
  isLoading?: boolean;
  onChangeTime(name: string, value: string): void;
}

const TimeRangeSelector: FC<TimeRangeSelectorProps> = ({
  title,
  name,
  value,
  timeSelectList,
  dataTestIdPrefix = 'time-range-selector',
  isLoading,
  onChangeTime,
}) => {
  const styles = makeStyles();

  const onChange = (event: SelectChangeEvent<string>) =>
    onChangeTime(event.target.name, event.target.value);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h6"
        data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(
          dataTestIdPrefix
        )}
      >
        {title}
      </Typography>
      <FormControl fullWidth>
        <Select
          fullWidth
          size="small"
          name={name}
          value={value}
          onChange={onChange}
          data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
            dataTestIdPrefix
          )}
          inputProps={{
            'data-testid':
              TIME_RANGE_SELECTOR_TEST_IDS.getInputTestId(dataTestIdPrefix),
          }}
          MenuProps={{
            sx: styles.timePickerMenu,
          }}
          sx={styles.timeRangeSelect}
          disabled={isLoading}
          endAdornment={
            isLoading && (
              <InputAdornment position="end">
                <CircularProgress
                  size={20}
                  data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getCircularProgressTestId(
                    dataTestIdPrefix
                  )}
                />
              </InputAdornment>
            )
          }
        >
          {timeSelectList.map((time) => (
            <MenuItem
              key={time.value}
              value={time.value}
              data-testid={TIME_RANGE_SELECTOR_TEST_IDS.getRangeMenuItemTestId(
                dataTestIdPrefix,
                time.label
              )}
            >
              {time.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default TimeRangeSelector;
