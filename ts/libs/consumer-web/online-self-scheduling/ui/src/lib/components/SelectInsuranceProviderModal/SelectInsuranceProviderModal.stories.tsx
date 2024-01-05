import { Meta, StoryFn } from '@storybook/react';
import SelectInsuranceProviderModal, {
  InsuranceNetworkPayer,
} from './SelectInsuranceProviderModal';

const mockPayers: InsuranceNetworkPayer[] = [
  {
    id: '2',
    name: 'B Insurance 2',
    classificationId: '1',
    classificationName: 'Medicare',
    stateAbbrs: ['CO'],
  },
  {
    id: '2',
    name: 'C Insurance 3',
    classificationId: '1',
    classificationName: 'Medicare',
    stateAbbrs: ['CO'],
  },
  {
    id: '3',
    name: 'A Insurance 1',
    classificationId: '1',
    classificationName: 'Medicare',
    stateAbbrs: ['CO'],
  },
];

export default {
  title: 'SelectInsuranceProviderModal',
  component: SelectInsuranceProviderModal,
  args: {
    open: true,
    insuranceNotInListButtonLabel: 'My insurance isn’t on this list',
    searchOptions: mockPayers,
    insuranceSearch: '',
    onClose: () => console.log('onClose'),
    onChooseInsurance: () => console.log('onChooseInsurance'),
    onChangeSearch: () => console.log('onChangeSearch'),
    onNotOnThisListClick: () => console.log('onNotOnThisListClick'),
  },
} as Meta<typeof SelectInsuranceProviderModal>;

const Template: StoryFn<typeof SelectInsuranceProviderModal> = (args) => (
  <SelectInsuranceProviderModal {...args} />
);

export const Basic = Template.bind({});

export const WithScrolling = Template.bind({});
WithScrolling.args = {
  searchOptions: mockPayers,
};

export const RelationToPatientIsSomeoneElse = Template.bind({});
RelationToPatientIsSomeoneElse.args = {
  insuranceNotInListButtonLabel: 'Their insurance isn’t on this list',
};
