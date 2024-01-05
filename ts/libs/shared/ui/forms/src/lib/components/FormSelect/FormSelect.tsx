import { PropsWithChildren } from 'react';
import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectProps,
  FormHelperText,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormSelectProps<
  TFieldValues extends FieldValues,
  TSelectValue = unknown
> = PropsWithChildren<
  Omit<ControllerProps<TFieldValues>, 'render'> & {
    selectProps?: SelectProps<TSelectValue> & FormComponentProps;
  }
>;

export const FormSelect = <
  TFieldValues extends FieldValues,
  TSelectValue = unknown
>({
  selectProps,
  children,
  ...controllerProps
}: FormSelectProps<TFieldValues, TSelectValue>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps, fieldState: { error } }) => (
      <>
        <Select
          {...controllerRenderProps}
          error={!!error?.message}
          {...selectProps}
        >
          {children}
        </Select>
        {error?.message && (
          <FormHelperText error>{error?.message}</FormHelperText>
        )}
      </>
    )}
  />
);
