import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  FormControlLabel,
  RadioGroup,
  SxStylesValue,
  Radio,
  Typography,
  FormControlLabelProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormRadioGroupProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  radioOptions: (Omit<
    FormControlLabelProps & {
      value: string;
    },
    'control'
  > &
    FormComponentProps)[];
  optionSx?: SxStylesValue;
};

export const FormRadioGroup = <TFieldValues extends FieldValues>({
  radioOptions,
  optionSx,
  ...controllerProps
}: FormRadioGroupProps<TFieldValues>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps }) => (
      <RadioGroup {...controllerRenderProps}>
        {radioOptions.map((radioOption) => (
          <FormControlLabel
            key={radioOption.value}
            data-testid={radioOption['data-testid']}
            value={radioOption.value}
            control={<Radio />}
            label={
              <Typography
                data-dd-privacy={radioOption['data-dd-privacy']}
                sx={optionSx}
              >
                {radioOption.label}
              </Typography>
            }
          />
        ))}
      </RadioGroup>
    )}
  />
);
