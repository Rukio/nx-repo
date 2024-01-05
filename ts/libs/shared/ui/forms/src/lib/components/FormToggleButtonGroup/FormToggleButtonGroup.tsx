import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  ToggleButtonGroup,
  ToggleButtonProps,
  ToggleButton,
  ToggleButtonGroupProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormToggleButtonGroupProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  toggleButtonsProps: ToggleButtonGroupProps & FormComponentProps;
  toggleButtons: (Omit<ToggleButtonProps & { value: string }, 'control'> &
    FormComponentProps)[];
};

export const FormToggleButtonGroup = <TFieldValues extends FieldValues>({
  toggleButtons,
  toggleButtonsProps,
  ...controllerProps
}: FormToggleButtonGroupProps<TFieldValues>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps }) => (
      <ToggleButtonGroup {...controllerRenderProps} {...toggleButtonsProps}>
        {toggleButtons.map((toggleButton) => (
          <ToggleButton
            key={toggleButton['data-testid']}
            value={toggleButton.value}
            data-testid={toggleButton['data-testid']}
          >
            {toggleButton.value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    )}
  />
);
