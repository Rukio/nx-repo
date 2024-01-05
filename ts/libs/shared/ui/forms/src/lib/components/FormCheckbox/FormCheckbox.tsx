import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  FormControlLabel,
  FormControlLabelProps,
  CheckboxProps,
  Checkbox,
  FormControl,
  FormHelperText,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormCheckboxProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  formControlLabelProps: Omit<FormControlLabelProps, 'control'> &
    FormComponentProps;
  checkboxProps?: CheckboxProps & FormComponentProps;
};

export const FormCheckbox = <TFieldValues extends FieldValues>({
  formControlLabelProps,
  checkboxProps,
  ...controllerProps
}: FormCheckboxProps<TFieldValues>) => {
  return (
    <Controller
      {...controllerProps}
      render={({ field: controllerRenderProps, fieldState: { error } }) => (
        <FormControl error={!!error}>
          <FormControlLabel
            {...formControlLabelProps}
            control={
              <Checkbox
                {...checkboxProps}
                {...controllerRenderProps}
                checked={controllerRenderProps.value}
                onChange={(_ev, checked) => {
                  controllerRenderProps.onChange(checked);
                }}
              />
            }
          />
          {error?.message && (
            <FormHelperText error>{error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
