import { useField } from 'formik';
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';

const styles = makeSxStyles({
  label: {
    backgroundColor: 'white',
    padding: '0 6px',
  },
});

type Option = {
  name: string;
  id: number | string;
};

type FormikSelectFieldProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  name: string;
  label: string;
  options: Option[];
  customRender?: (item: string) => JSX.Element;
  onBlur?: (value: string | number) => void;
};

export const FormikSelectField: React.FC<FormikSelectFieldProps> = ({
  disabled,
  options,
  name,
  label,
  fullWidth,
  customRender,
  onBlur,
}) => {
  const [field, meta] = useField(name);
  const { value: selectedValue } = field;
  const { touched, error } = meta;
  const isInErrorState = !!(touched && error);

  const renderHelperText = () => {
    if (isInErrorState) {
      return <FormHelperText>{error}</FormHelperText>;
    }

    return null;
  };

  return (
    <FormControl fullWidth={fullWidth} error={isInErrorState}>
      <InputLabel sx={styles.label}>{label}</InputLabel>
      <Select
        {...field}
        onBlur={(e) => {
          field.onBlur(e);
          onBlur?.(selectedValue);
        }}
        value={selectedValue || ''}
        inputProps={{
          'data-testid': `${name.toLowerCase()}-select`,
        }}
        disabled={disabled}
      >
        {options.map((item) => (
          <MenuItem
            key={item.id}
            value={item.id}
            data-testid={`${name.toLowerCase()}-${formatDataTestId(
              item.name
            )}-option`}
          >
            {/* Min. Height of 36px: normal height 24 + 6 padding top and bottom */}
            {customRender
              ? customRender(item.name)
              : item.name || <Box minHeight="24px" />}
          </MenuItem>
        ))}
      </Select>
      {renderHelperText()}
    </FormControl>
  );
};
