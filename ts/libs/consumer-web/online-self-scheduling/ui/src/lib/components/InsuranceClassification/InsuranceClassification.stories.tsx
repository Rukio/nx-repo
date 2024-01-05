import { Meta, StoryFn } from '@storybook/react';
import InsuranceClassification, {
  InsuranceClassificationProps,
  InsuranceType,
  QuestionYesNoAnswer,
} from './InsuranceClassification';
import { InsuranceClassificationFormValues } from './contants';
import { useForm } from 'react-hook-form';

const mockInsuranceClassificationFormValues: InsuranceClassificationFormValues =
  {
    insuranceType: InsuranceType.Medicaid,
    isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
    stateAbbr: '',
    insurancePayerId: '',
  };

const defaultArgs: Partial<InsuranceClassificationProps> = {
  isRequesterRelationshipSelf: true,
  showSearchInsurance: true,
  isSubmitButtonDisabled: false,
  insuranceValue: InsuranceType.Medicaid,
  onSubmit: () => console.log('onSubmit'),
  onSearchInsuranceProvidersClick: () =>
    console.log('onSearchInsuranceProvidersClick'),
  stateOptions: [
    {
      id: 1,
      name: 'Arizona',
      abbreviation: 'AZ',
    },
    {
      id: 2,
      name: 'Colorado',
      abbreviation: 'CO',
    },
  ],
};

export default {
  title: 'InsuranceClassification',
  component: InsuranceClassification,
} as Meta<typeof InsuranceClassification>;

const Template: StoryFn<typeof InsuranceClassification> = (args) => {
  const { control: classificationControl } =
    useForm<InsuranceClassificationFormValues>({
      values: mockInsuranceClassificationFormValues,
    });

  return (
    <InsuranceClassification
      {...defaultArgs}
      {...args}
      formControl={classificationControl}
    />
  );
};

export const Basic = Template.bind({});

export const WithTwoQuestions = Template.bind({});
WithTwoQuestions.args = {
  showSecondQuestion: true,
};

export const WithSelectState = Template.bind({});
WithSelectState.args = {
  showSearchInsurance: false,
  showSelectState: true,
  showSecondQuestion: true,
};
