import { FC } from 'react';
import { Suggestion } from 'react-places-autocomplete';
import { render, screen, waitFor } from '../../../testUtils';
import AddressInput, { AddressInputProps } from './AddressInput';

const suggestions: Suggestion[] = [
  {
    id: '1',
    description: 'County Road 23, Denver, Denver, CO, USA',
    placeId: '123',
    active: false,
    index: 0,
    formattedSuggestion: {
      mainText: 'County Road 23',
      secondaryText: 'Denver, Denver, CO, USA',
    },
    matchedSubstrings: [{ length: 0, offset: 0 }],
    terms: [],
    types: [],
  },
];

const props: AddressInputProps = {
  placeholder: 'placeholder-test',
  disabled: false,
  initialSuggestions: suggestions,
  setAddress: jest.fn(),
  beforeSelect: jest.fn(),
};

jest.mock('react-places-autocomplete', () => ({
  __esModule: true,
  default: ({ children, onSelect }: { children: FC; onSelect: () => void }) =>
    children({
      getInputProps: jest.fn(() => ({
        value: 'County Road 23, Denver, Denver, CO, USA',
      })),
      suggestions: [],
      getSuggestionItemProps: jest.fn(() => ({
        onClick: onSelect,
      })),
    }),
  geocodeByAddress: jest.fn().mockResolvedValue([
    {
      place_id: '1',
    },
  ]),
  geocodeByPlaceId: jest.fn().mockResolvedValue([
    {
      address_components: [
        {
          long_name: '12',
          short_name: '12',
          types: ['street_number'],
        },
        {
          long_name: 'Test St.',
          short_name: 'Test',
          types: ['route'],
        },
      ],
    },
  ]),
  getLatLng: jest.fn().mockResolvedValue({ lat: 1.2, lng: 5.6 }),
}));

describe('<AddressInput />', () => {
  it('AddressInput snapshot', () => {
    const { asFragment } = render(<AddressInput />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('AddressInput snapshot disabled', () => {
    const { asFragment } = render(<AddressInput />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should select an item from the drop-down list', async () => {
    const { user } = render(<AddressInput {...props} />);

    const dropdownItem = screen.getByTestId('address-suggestion-menuitem');
    await user.click(dropdownItem);

    const input = screen.getByTestId('address-field-input');
    await waitFor(() => {
      expect(input).toHaveValue('County Road 23, Denver, Denver, CO, USA');
    });
  });
});
