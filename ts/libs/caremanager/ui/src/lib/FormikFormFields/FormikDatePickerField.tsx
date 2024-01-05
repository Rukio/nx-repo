import { useState } from 'react';
import { useField, useFormikContext } from 'formik';
import {
  DesktopDatePicker,
  LocalizationProvider,
  TextField,
} from '@*company-data-covered*/design-system';
import { parseISO } from 'date-fns';

type FieldData = {
  name: string;
  label: string;
};

type FormikDatePickerFieldProps = {
  disableFuture?: boolean;
  dataTestId?: string;
  fullWidth?: boolean;
  fieldData: FieldData;
};

export const FormikDatePickerField: React.FC<FormikDatePickerFieldProps> = ({
  fieldData,
  dataTestId = '',
  disableFuture = false,
  fullWidth = false,
  ...rest
}) => {
  const [field, meta] = useField<string | Date>(fieldData);

  const dateValue =
    field.value instanceof Date ? field.value : parseISO(field.value);
  const fieldValue = !isNaN(+dateValue) ? dateValue.toISOString() : '';
  const { setFieldValue } = useFormikContext();
  const [isTouched, setIsTouched] = useState(false);
  const { touched, error } = meta;
  // DatePicker will not recognize when input has been touched unless form has been submitted
  const isInErrorState = !!((touched || isTouched) && error);
  const renderHelperText = () => {
    if (isInErrorState) {
      return error;
    }

    return null;
  };

  const datePickerProps = {
    helperText: renderHelperText(),
    error: isInErrorState,
  };

  const textFieldProps = {
    InputLabelProps: {
      htmlFor: field.name,
    },
  };

  const onChangeDate = async (date: Date) => {
    // This is a native method from formik that is necessary for working with MUI.
    // Without this method the date picker start doing weird things.
    await setFieldValue(field.name, date);
    setIsTouched(true);
  };

  return (
    <LocalizationProvider>
      <DesktopDatePicker<string, Date>
        label={fieldData.label}
        value={fieldValue}
        onChange={(value) => value && onChangeDate(value)}
        closeOnSelect={false}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth={fullWidth}
            helperText={renderHelperText()}
            error={isInErrorState}
            data-testid={`${dataTestId}-date`}
            name="admittedAt"
            value={field.value}
            {...textFieldProps}
          />
        )}
        disableFuture={disableFuture}
        {...rest}
        {...datePickerProps}
      />
    </LocalizationProvider>
  );
};
