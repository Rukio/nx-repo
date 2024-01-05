import { FC } from 'react';
import { Suggestion } from 'react-places-autocomplete';
import { render, screen, waitFor } from '../../testUtils';
import { WEB_REQUEST_ROUTES } from '../constants';
import RequestAddress from './RequestAddress';
import { REQUEST_ADDRESS_TEST_IDS } from './testIds';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
  getConfig: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSuggestion: Suggestion = {
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
};
jest.mock('react-places-autocomplete', () => ({
  __esModule: true,
  default: jest.fn(
    ({ children, onSelect }: { children: FC; onSelect: () => void }) =>
      children({
        getInputProps: jest.fn(() => ({
          value: 'County Road 23, Denver, Denver, CO, USA',
        })),
        suggestions: [mockSuggestion],
        getSuggestionItemProps: jest.fn(() => ({
          onClick: onSelect,
        })),
      })
  ),
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
        {
          long_name: '12345',
          short_name: '12345',
          types: ['postal_code'],
        },
      ],
    },
  ]),
  getLatLng: jest.fn().mockResolvedValue({ lat: 1.2, lng: 5.6 }),
}));

describe('<RequestAddress />', () => {
  it('should render correctly', async () => {
    render(<RequestAddress />);

    const header = await screen.findByTestId(
      REQUEST_ADDRESS_TEST_IDS.LOCATION_HEADER
    );
    expect(header).toHaveTextContent('Where do you need us to go?');

    const locationConfirmMessage = screen.getByTestId(
      REQUEST_ADDRESS_TEST_IDS.LOCATION_CONFIRM_MESSAGE
    );
    expect(locationConfirmMessage).toBeVisible();
    expect(locationConfirmMessage).toHaveTextContent(
      'Let’s confirm that we can come to your location.'
    );
  });

  it('should select valid address and navigate to next step on continue button click', async () => {
    const { user } = render(<RequestAddress />);

    const header = await screen.findByTestId(
      REQUEST_ADDRESS_TEST_IDS.LOCATION_HEADER
    );
    expect(header).toHaveTextContent('Where do you need us to go?');

    const locationContinueButton = screen.getByTestId(
      REQUEST_ADDRESS_TEST_IDS.LOCATION_CONTINUE_BUTTON
    );
    expect(locationContinueButton).toBeVisible();
    expect(locationContinueButton).toBeDisabled();

    const dropdownItem = screen.getByTestId('address-suggestion-menuitem');
    await user.click(dropdownItem);

    const input = screen.getByTestId('address-field-input');
    await waitFor(() => {
      expect(input).toHaveValue(mockSuggestion.description);
    });

    await waitFor(() => {
      expect(locationContinueButton).toBeEnabled();
    });

    await user.click(locationContinueButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        WEB_REQUEST_ROUTES.requestPreferredTime
      );
    });
  });
});
