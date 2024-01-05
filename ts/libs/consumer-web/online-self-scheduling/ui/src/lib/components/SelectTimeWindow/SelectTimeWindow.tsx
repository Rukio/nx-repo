import { FC } from 'react';
import { Control } from 'react-hook-form';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { FormHeader } from '../FormHeader';
import { FormFooter } from '../FormFooter';
import {
  AvailabilityDayToggleValue,
  TimeWindowsSection,
} from '../TimeWindowsSection';

const makeStyles = () =>
  makeSxStyles({
    formFooter: { paddingTop: 3 },
  });

export type TimeOptionType = {
  label: string;
  value: string;
};

export type SelectTimeWindowFieldValues = {
  startTime: string;
  endTime: string;
  selectedAvailabilityDay: AvailabilityDayToggleValue;
};

export type SelectTimeWindowProps = {
  startTimeOptions: TimeOptionType[];
  endTimeOptions: TimeOptionType[];
  isSubmitButtonDisabled?: boolean;
  title: string;
  timeWindowSectionTitle: string;
  subtitle?: string;
  isTimeRangeErrorShown?: boolean;
  formControl: Control<SelectTimeWindowFieldValues>;
  onSubmit: () => void;
};

const SelectTimeWindow: FC<SelectTimeWindowProps> = ({
  startTimeOptions,
  endTimeOptions,
  isSubmitButtonDisabled,
  title,
  timeWindowSectionTitle,
  subtitle,
  isTimeRangeErrorShown,
  formControl,
  onSubmit,
}) => {
  const styles = makeStyles();

  return (
    <>
      <FormHeader title={title} subtitle={subtitle} />
      <TimeWindowsSection
        formControl={formControl}
        startTimeOptions={startTimeOptions}
        endTimeOptions={endTimeOptions}
        isTimeRangeErrorShown={isTimeRangeErrorShown}
        title={timeWindowSectionTitle}
      />
      <Box sx={styles.formFooter}>
        <FormFooter
          onSubmit={onSubmit}
          isSubmitButtonDisabled={isSubmitButtonDisabled}
        />
      </Box>
    </>
  );
};

export default SelectTimeWindow;
