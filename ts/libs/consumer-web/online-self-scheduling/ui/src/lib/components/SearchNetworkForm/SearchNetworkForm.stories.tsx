import { Meta, StoryFn } from '@storybook/react';
import { useForm } from 'react-hook-form';
import {
  SearchNetworkFormFieldValues,
  SearchNetworkFormProps,
  SearchNetworkForm,
} from './SearchNetworkForm';
import { InsuranceProviderOption } from '../SelectInsuranceProviderModal';

const insurancePayerMock: InsuranceProviderOption = {
  id: '1',
  label: 'A Insurance 3',
};
const mockSearchNetworkFormValues: SearchNetworkFormFieldValues = {
  payer: insurancePayerMock,
  networkId: '1',
  memberId: '12345',
};

const defaultArgs: Partial<SearchNetworkFormProps> = {
  onVerifyInsurance: () => console.log('onVerifyInsurance'),
  onRemoveSelectedInsuranceProvider: () =>
    console.log('onRemoveSelectedInsuranceProvider'),
  onClickSelectedInsuranceProvider: () =>
    console.log('onClickSelectedInsuranceProvider'),
  onAddAnotherInsuranceButton: () => console.log('onAddAnotherInsuranceButton'),
  onContinueToConfirmDetailsClick: () =>
    console.log('onContinueToConfirmDetailsClick'),
  isAddAnotherInsuranceDisabled: false,
  isAddAnotherInsuranceButtonVisible: true,
  isVerifyInsuranceButtonDisabled: false,
  isRemoveInsurancePayerButtonVisible: true,
  alert: {
    severity: 'success',
    title: 'In Network',
    message: 'We’re in network with your insurance.',
  },
  networkOptions: [
    {
      label: 'Network 1',
      value: '1',
    },
    {
      label: 'Network 2',
      value: '2',
    },
  ],
  searchNetworkFormTitle:
    'Please select the network that best matches your insurance card',
  isInsuranceIneligible: false,
  submitButtonLabel: 'Continue',
  insuranceCardFrontUrl: '',
  insuranceCardBackUrl: '',
};

export default {
  title: 'SearchNetworkForm',
  component: SearchNetworkForm,
} as Meta<typeof SearchNetworkForm>;

const Template: StoryFn<typeof SearchNetworkForm> = (args) => {
  const { control } = useForm<SearchNetworkFormFieldValues>({
    values: mockSearchNetworkFormValues,
  });

  return <SearchNetworkForm {...defaultArgs} {...args} formControl={control} />;
};

export const Basic = Template.bind({});
