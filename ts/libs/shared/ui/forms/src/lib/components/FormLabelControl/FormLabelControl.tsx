import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  FormControlLabel,
  FormControlLabelProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormLabelControlProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  formControlLabelProps: FormControlLabelProps & FormComponentProps;
};

export const FormLabelControl = <TFieldValues extends FieldValues>({
  formControlLabelProps,
  ...controllerProps
}: FormLabelControlProps<TFieldValues>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps }) => (
      <FormControlLabel {...formControlLabelProps} {...controllerRenderProps} />
    )}
  />
);
