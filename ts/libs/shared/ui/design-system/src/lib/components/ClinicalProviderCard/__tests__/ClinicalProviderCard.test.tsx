import { render, screen } from '../../../../test-utils';
import { Box } from '../../..';
import CLINICAL_PROVIDER_CARD_TEST_IDS from '../testIds';

import ClinicalProviderCard, {
  ClinicalProviderDetails,
  ClinicalProviderCardProps,
  ClinicalProviderCardLayoutDirection,
} from '../index';

const mockClinicalProvider: ClinicalProviderDetails = {
  id: 42,
  name: 'theodor GEISEL',
  address: '7301 ENCELIA drive',
  city: 'la JOlla',
  state: 'cA',
  zipCode: '92037',
  phone: '999 555 1212',
  fax: '999 555 1000',
};

interface SetupInterface {
  clinicalProviderCardProps: ClinicalProviderCardProps;
  containerWidthPixels: number;
}

const setup = ({
  clinicalProviderCardProps,
  containerWidthPixels,
}: SetupInterface) => {
  const {
    clinicalProviderDetails,
    isFaxVisible,
    onSelect,
    testIdPrefix,
    layoutDirection,
  } = clinicalProviderCardProps;

  return render(
    <Box sx={{ width: `${containerWidthPixels}px` }}>
      <ClinicalProviderCard
        clinicalProviderDetails={clinicalProviderDetails}
        isFaxVisible={isFaxVisible}
        onSelect={onSelect}
        testIdPrefix={testIdPrefix}
        layoutDirection={layoutDirection}
      />
    </Box>
  );
};

const getTestIdFor = (testId: string): string => `test-${testId}`;

describe('ClinicalProviderCard', () => {
  it('should render correctly horizontally with fax and test ids', () => {
    const mockOnSelect = jest.fn();
    const { asFragment } = setup({
      clinicalProviderCardProps: {
        clinicalProviderDetails: mockClinicalProvider,
        isFaxVisible: true,
        onSelect: mockOnSelect,
        testIdPrefix: 'test',
      },
      containerWidthPixels: 500,
    });
    expect(
      screen.getByTestId(
        `${getTestIdFor(
          CLINICAL_PROVIDER_CARD_TEST_IDS.CLINICAL_PROVIDER_CARD
        )}-${mockClinicalProvider.id}`
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_NAME)
      )
    ).toHaveTextContent(mockClinicalProvider.name.toUpperCase());
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_ADDRESS_LINE_1)
      )
    ).toHaveTextContent(mockClinicalProvider.address.toLowerCase());
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_CITY_STATE)
      )
    ).toHaveTextContent(
      `${mockClinicalProvider.city.toLowerCase()}, ${mockClinicalProvider.state.toUpperCase()} ${
        mockClinicalProvider.zipCode
      }`
    );
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_PHONE)
      )
    ).toHaveTextContent('(999) 555-1212');
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX_CONTAINER)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX)
      )
    ).toHaveTextContent('(999) 555-1000');
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_SELECT_BUTTON)
      )
    ).toBeVisible();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly vertically', () => {
    const mockOnSelect = jest.fn();
    const { asFragment } = setup({
      clinicalProviderCardProps: {
        clinicalProviderDetails: mockClinicalProvider,
        isFaxVisible: true,
        onSelect: mockOnSelect,
        testIdPrefix: 'test',
        layoutDirection: ClinicalProviderCardLayoutDirection.vertical,
      },
      containerWidthPixels: 300,
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should not show fax is display is disabled', () => {
    const mockOnSelect = jest.fn();
    setup({
      clinicalProviderCardProps: {
        clinicalProviderDetails: mockClinicalProvider,
        isFaxVisible: false,
        onSelect: mockOnSelect,
        testIdPrefix: 'test',
      },
      containerWidthPixels: 500,
    });
    expect(
      screen.queryByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX_CONTAINER)
      )
    ).not.toBeInTheDocument();
  });

  it('should show none for fax if no fax value', () => {
    const mockOnSelect = jest.fn();
    setup({
      clinicalProviderCardProps: {
        clinicalProviderDetails: { ...mockClinicalProvider, fax: '' },
        isFaxVisible: true,
        onSelect: mockOnSelect,
        testIdPrefix: 'test',
      },
      containerWidthPixels: 500,
    });
    expect(
      screen.getByTestId(
        getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX_CONTAINER)
      )
    ).toBeVisible();
    expect(screen.getByTestId('test-provider-fax')).toHaveTextContent('None');
  });

  it('should be selectable', async () => {
    const mockOnSelect = jest.fn();
    const { user } = setup({
      clinicalProviderCardProps: {
        clinicalProviderDetails: mockClinicalProvider,
        isFaxVisible: true,
        onSelect: mockOnSelect,
        testIdPrefix: 'test',
      },
      containerWidthPixels: 500,
    });
    const selectButton = screen.getByTestId(
      getTestIdFor(CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_SELECT_BUTTON)
    );
    expect(selectButton).toHaveTextContent('Select');
    await user.click(selectButton);
    expect(mockOnSelect).toHaveBeenCalledWith(mockClinicalProvider.id);
  });
});
