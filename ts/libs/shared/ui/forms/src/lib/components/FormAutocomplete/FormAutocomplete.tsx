import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  Autocomplete,
  AutocompleteProps,
  TextField,
  TextFieldProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormAutocompleteProps<
  TFieldValues extends FieldValues,
  TAutocompleteValue,
  TMultiple extends boolean | undefined = boolean,
  TDisableClearable extends boolean | undefined = boolean,
  TFreeSolo extends boolean | undefined = boolean
> = Omit<ControllerProps<TFieldValues>, 'render'> & {
  autocompleteProps: Omit<
    AutocompleteProps<
      TAutocompleteValue,
      TMultiple,
      TDisableClearable,
      TFreeSolo
    >,
    'renderInput'
  > &
    FormComponentProps;
  textFieldProps?: TextFieldProps & FormComponentProps;
};

export const FormAutocomplete = <
  TFieldValues extends FieldValues,
  TAutocompleteValue,
  TMultiple extends boolean | undefined = boolean,
  TDisableClearable extends boolean | undefined = boolean,
  TFreeSolo extends boolean | undefined = boolean
>({
  autocompleteProps,
  textFieldProps,
  ...controllerProps
}: FormAutocompleteProps<
  TFieldValues,
  TAutocompleteValue,
  TMultiple,
  TDisableClearable,
  TFreeSolo
>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps, fieldState: { error } }) => (
      <Autocomplete
        {...autocompleteProps}
        {...controllerRenderProps}
        onChange={(_ev, item) => {
          controllerRenderProps.onChange(item);
        }}
        renderInput={(autocompleteRenderInputParams) => (
          <TextField
            {...autocompleteRenderInputParams}
            {...textFieldProps}
            error={!!error?.message}
            helperText={error?.message}
          />
        )}
      />
    )}
  />
);
