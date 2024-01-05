import { rest } from 'msw';
import {
  MarketFeasibilityStatus,
  mockPatientAccountAddressData,
  mockPlacesOfService,
  mockMarketsAvailabilityZipCodeQuery,
  mockStates,
  mockCreatePatientAccountAddressResponse,
  mockDomainPatientAccountAddress,
  mockSelfScheduleData,
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  FORM_FOOTER_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  ADDRESS_FORM_TEST_IDS,
  ADDRESS_SUGGESTION_SECTION_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { AddressStatus } from '@*company-data-covered*/consumer-web-types';
import {
  render,
  screen,
  renderHook,
  testSegmentPageView,
  waitFor,
  within,
} from '../../testUtils';
import {
  mswServer,
  buildMarketsAvailabilityZipcodeApiPath,
  buildCheckMarketFeasibilityApiPath,
  buildPatientAccountAddressApiPath,
  buildCacheApiPath,
} from '../../testUtils/server';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { Address } from './Address';
import { ADDRESS_TEST_IDS } from './testIds';
import { FORM_SELECT_MENU_ITEM_TEST_IDS } from '@*company-data-covered*/shared/ui/forms';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const setup = () => {
  mswServer.use(
    rest.get(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ data: [] }));
    })
  );

  return render(<Address />, {
    preloadedState: {
      manageSelfSchedule: {
        data: { patientId: mockSelfScheduleData.patientId },
      },
    },
    withRouter: true,
  });
};

const setupWithoutDelay = () => {
  mswServer.use(
    rest.get(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ data: [] }));
    })
  );

  return render(<Address />, {
    preloadedState: {
      manageSelfSchedule: {
        data: { patientId: mockSelfScheduleData.patientId },
      },
    },
    userEventOptions: {
      delay: null,
    },
    withRouter: true,
  });
};

const setupWithExistingAddress = () => {
  return render(<Address />, {
    withRouter: true,
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: { data: mockSelfScheduleData },
    },
  });
};

const findAllAddressesRadioOptions = () =>
  screen.findAllByTestId(
    new RegExp(ADDRESS_FORM_TEST_IDS.ADDRESS_RADIO_OPTION_PREFIX)
  );

const getAddressRadioOption = (addressId: string) =>
  screen.getByTestId(ADDRESS_FORM_TEST_IDS.getAddressRadioOption(addressId));

const getAddressRadioOptionInput = (addressId: string) =>
  within(getAddressRadioOption(addressId)).getByRole('radio');

const findZipCodeInput = () =>
  screen.findByTestId(ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT);

const queryZipCodeInput = () =>
  screen.queryByTestId(ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT);

const getSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

describe('<Address />', () => {
  it('should render page layout loader', async () => {
    mswServer.use(
      rest.post(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
        return res(ctx.status(200), ctx.delay(100));
      })
    );

    setup();

    const pageLayoutloader = screen.getByTestId(PAGE_LAYOUT_TEST_IDS.LOADER);
    expect(pageLayoutloader).toBeVisible();

    const addressForm = screen.queryByTestId(ADDRESS_FORM_TEST_IDS.ROOT);
    expect(addressForm).not.toBeInTheDocument();
  });

  it('should render correctly', async () => {
    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      RequestProgressStep.Address.toString()
    );

    const addressForm = screen.getByTestId(ADDRESS_FORM_TEST_IDS.ROOT);
    expect(addressForm).toBeVisible();

    const backButton = screen.getByTestId(PAGE_LAYOUT_TEST_IDS.BACK_BUTTON);
    expect(backButton).toBeVisible();
    expect(backButton).toHaveAttribute(
      'href',
      ONLINE_SELF_SCHEDULING_ROUTES.CONSENT
    );

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
  });

  it('should render correctly state select', async () => {
    const { user } = setup();

    const zipCodeInput = await findZipCodeInput();

    expect(zipCodeInput).toBeVisible();

    await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

    const select = await screen.findByTestId(ADDRESS_FORM_TEST_IDS.STATE_FIELD);
    expect(select).toBeVisible();

    const selectButton = within(select).getByRole('button');
    expect(selectButton).toBeVisible();

    await user.click(selectButton);

    mockStates.forEach(({ abbreviation, name }) => {
      const selectFieldOption = screen.getByTestId(
        FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
          ADDRESS_FORM_TEST_IDS.STATE_SELECT_ITEM_PREFIX,
          abbreviation.toString()
        )
      );

      expect(selectFieldOption).toBeVisible();
      expect(selectFieldOption).toHaveTextContent(name);
    });
  });

  it('should render properly existing patient addresses', async () => {
    const mockSelectedAddressId = String(mockDomainPatientAccountAddress.id);
    const { user } = setupWithExistingAddress();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    await findAllAddressesRadioOptions();
    const existingAddressRadioOption = getAddressRadioOption(
      mockSelectedAddressId
    );
    const existingAddressRadioOptionInput = getAddressRadioOptionInput(
      mockSelectedAddressId
    );
    const addNewAddressRadioOption = getAddressRadioOption('');
    const addNewAddressRadioOptionInput = getAddressRadioOptionInput('');

    expect(existingAddressRadioOption).toBeVisible();
    expect(existingAddressRadioOptionInput).toBeChecked();

    expect(addNewAddressRadioOption).toBeVisible();
    expect(addNewAddressRadioOptionInput).not.toBeChecked();

    expect(queryZipCodeInput()).not.toBeInTheDocument();

    const submitButton = getSubmitButton();

    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    await user.click(addNewAddressRadioOption);

    const zipCodeInput = await findZipCodeInput();

    expect(zipCodeInput).toBeVisible();

    await user.type(zipCodeInput, 'Invalid Zip');

    await user.click(existingAddressRadioOption);
    expect(existingAddressRadioOptionInput).toBeChecked();
    expect(addNewAddressRadioOptionInput).not.toBeChecked();

    const formSubmit = getSubmitButton();
    await waitFor(() => expect(formSubmit).toBeVisible());

    await waitFor(() => {
      expect(formSubmit).toBeEnabled();
    });
  });

  it('should render correct alert messages', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    const addressForm = screen.getByTestId(ADDRESS_FORM_TEST_IDS.ROOT);
    expect(addressForm).toBeVisible();

    const zipCodeInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT
    );
    expect(zipCodeInput).toBeVisible();
    await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

    const locationFieldsSection = await screen.findByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION
    );
    expect(locationFieldsSection).toBeVisible();

    const streetAddress1Input = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_INPUT
    );
    expect(streetAddress1Input).toBeVisible();
    await user.click(streetAddress1Input);

    const cityInput = screen.getByTestId(ADDRESS_FORM_TEST_IDS.CITY_INPUT);
    expect(cityInput).toBeVisible();
    await user.click(cityInput);

    const statesSelect = screen.getByTestId(ADDRESS_FORM_TEST_IDS.STATE_SELECT);
    expect(statesSelect).toBeVisible();
    await user.click(statesSelect);

    const locationTypeSelect = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT
    );
    await user.click(locationTypeSelect);

    await user.click(statesSelect);

    const streetAddress1Field = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_FIELD
    );
    const streetAdressErrorMessage = within(streetAddress1Field).getByText(
      'Street Address is required'
    );
    expect(streetAdressErrorMessage).toBeVisible();

    const cityField = screen.getByTestId(ADDRESS_FORM_TEST_IDS.CITY_FIELD);
    const cityErrorMessage = within(cityField).getByText('City is required');
    expect(cityErrorMessage).toBeVisible();

    const stateField = screen.getByTestId(ADDRESS_FORM_TEST_IDS.STATE_FIELD);
    const stateErrorMessage = within(stateField).getByText('State is required');
    expect(stateErrorMessage).toBeVisible();

    const locationTypeField = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_FIELD
    );
    const locationTypeErrorMessage = within(locationTypeField).getByText(
      'Location Type is required'
    );
    expect(locationTypeErrorMessage).toBeVisible();
  });

  it("should submit adding new patient's address and navigate to insurance", async () => {
    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    const zipCodeInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT
    );
    expect(zipCodeInput).toBeVisible();
    await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

    const locationFieldsSection = await screen.findByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION
    );
    expect(locationFieldsSection).toBeVisible();

    const streetAddress1Input = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_INPUT
    );
    expect(streetAddress1Input).toBeVisible();
    await user.type(
      streetAddress1Input,
      mockPatientAccountAddressData.streetAddress1
    );

    const streetAddress2Input = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_SECONDARY_INPUT
    );
    expect(streetAddress2Input).toBeVisible();
    await user.type(
      streetAddress2Input,
      String(mockPatientAccountAddressData.streetAddress2)
    );

    const cityInput = screen.getByTestId(ADDRESS_FORM_TEST_IDS.CITY_INPUT);
    expect(cityInput).toBeVisible();
    await user.type(cityInput, mockPatientAccountAddressData.city);

    const stateSelect = screen.getByTestId(ADDRESS_FORM_TEST_IDS.STATE_SELECT);
    const stateSelectButton = within(stateSelect).getByRole('button');
    expect(stateSelectButton).toBeVisible();
    await user.click(stateSelectButton);

    const stateSelectMenuItem = screen.getByTestId(
      FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
        ADDRESS_FORM_TEST_IDS.STATE_SELECT_ITEM_PREFIX,
        mockStates[0].abbreviation.toString()
      )
    );
    expect(stateSelectMenuItem).toBeVisible();
    await user.click(stateSelectMenuItem);

    const locationTypeSelect = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT
    );
    const locationTypeSelectButton =
      within(locationTypeSelect).getByRole('button');
    expect(locationTypeSelectButton).toBeVisible();
    await user.click(locationTypeSelectButton);

    const locationTypeSelectMenuItem = screen.getByTestId(
      FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
        ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT_ITEM_PREFIX,
        mockPlacesOfService[0].placeOfService.toString()
      )
    );
    expect(locationTypeSelectMenuItem).toBeVisible();
    await user.click(locationTypeSelectMenuItem);

    const locationDetailsInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_INPUT
    );
    expect(locationDetailsInput).toBeVisible();
    await user.type(
      locationDetailsInput,
      String(mockPatientAccountAddressData.locationDetails)
    );

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.LOCATION_ZIP_CODE,
        {
          [SEGMENT_EVENTS.LOCATION_ZIP_CODE]:
            mockPatientAccountAddressData.zipCode,
        }
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE
      );
    });
  });

  it('should submit form with existing patient address', async () => {
    const mockSelectedAddressId = String(mockDomainPatientAccountAddress.id);
    const { user } = setupWithExistingAddress();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    await findAllAddressesRadioOptions();
    const selectedRadioOption = getAddressRadioOption(mockSelectedAddressId);
    const selectedRadioOptionInput = getAddressRadioOptionInput(
      mockSelectedAddressId
    );

    const submitButton = getSubmitButton();

    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    expect(selectedRadioOption).toBeVisible();
    expect(selectedRadioOptionInput).toBeChecked();

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.LOCATION_ZIP_CODE,
        {
          [SEGMENT_EVENTS.LOCATION_ZIP_CODE]:
            mockDomainPatientAccountAddress.zip,
        }
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE
      );
    });
  });

  it('should not navigate to the next page if request failed', async () => {
    mswServer.use(
      rest.post(`${buildCacheApiPath()}`, (_req, res, ctx) => {
        return res.once(ctx.status(400));
      })
    );
    const mockSelectedAddressId = String(mockDomainPatientAccountAddress.id);
    const { user } = setupWithExistingAddress();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    await findAllAddressesRadioOptions();
    const selectedRadioOption = getAddressRadioOption(mockSelectedAddressId);
    const selectedRadioOptionInput = getAddressRadioOptionInput(
      mockSelectedAddressId
    );

    const submitButton = getSubmitButton();

    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    expect(selectedRadioOption).toBeVisible();
    expect(selectedRadioOptionInput).toBeChecked();

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(segmentHook.current.track).not.toBeCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).not.toBeCalled();
    });
  });

  it('should render address suggestion section then accept the address and navigate to insurance', async () => {
    mswServer.use(
      rest.post(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(201),
          ctx.json({
            data: {
              ...mockCreatePatientAccountAddressResponse,
              status: AddressStatus.CONFIRM,
            },
          })
        );
      })
    );

    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);

    const zipCodeInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT
    );
    expect(zipCodeInput).toBeVisible();
    await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

    const locationFieldsSection = await screen.findByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION
    );
    expect(locationFieldsSection).toBeVisible();

    const streetAddress1Input = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_INPUT
    );
    expect(streetAddress1Input).toBeVisible();
    await user.type(
      streetAddress1Input,
      mockPatientAccountAddressData.streetAddress1
    );

    const streetAddress2Input = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_SECONDARY_INPUT
    );
    expect(streetAddress2Input).toBeVisible();
    await user.type(
      streetAddress2Input,
      String(mockPatientAccountAddressData.streetAddress2)
    );

    const cityInput = screen.getByTestId(ADDRESS_FORM_TEST_IDS.CITY_INPUT);
    expect(cityInput).toBeVisible();
    await user.type(cityInput, mockPatientAccountAddressData.city);

    const stateSelect = screen.getByTestId(ADDRESS_FORM_TEST_IDS.STATE_SELECT);
    const stateSelectButton = within(stateSelect).getByRole('button');
    expect(stateSelectButton).toBeVisible();
    await user.click(stateSelectButton);

    const stateSelectMenuItem = screen.getByTestId(
      FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
        ADDRESS_FORM_TEST_IDS.STATE_SELECT_ITEM_PREFIX,
        mockStates[0].abbreviation.toString()
      )
    );
    expect(stateSelectMenuItem).toBeVisible();
    await user.click(stateSelectMenuItem);

    const locationTypeSelect = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT
    );
    const locationTypeSelectButton =
      within(locationTypeSelect).getByRole('button');
    expect(locationTypeSelectButton).toBeVisible();
    await user.click(locationTypeSelectButton);

    const locationTypeSelectMenuItem = screen.getByTestId(
      FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
        ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT_ITEM_PREFIX,
        mockPlacesOfService[0].placeOfService.toString()
      )
    );
    expect(locationTypeSelectMenuItem).toBeVisible();
    await user.click(locationTypeSelectMenuItem);

    const locationDetailsInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_INPUT
    );
    expect(locationDetailsInput).toBeVisible();
    await user.type(
      locationDetailsInput,
      String(mockPatientAccountAddressData.locationDetails)
    );

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const addressSuggestionSection = await screen.findByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ROOT
    );
    expect(addressSuggestionSection).toBeVisible();

    const validatedAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_BUTTON
    );
    expect(validatedAddressButton).toBeVisible();

    await user.click(validatedAddressButton);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.LOCATION_ZIP_CODE,
        {
          [SEGMENT_EVENTS.LOCATION_ZIP_CODE]:
            mockCreatePatientAccountAddressResponse.address?.zip,
        }
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE
      );
    });
  });

  describe('market availability alert', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should render circular loader', async () => {
      mswServer.use(
        rest.post(buildCheckMarketFeasibilityApiPath(), (_req, res, ctx) => {
          return res(ctx.status(200), ctx.delay(100), ctx.json({ data: null }));
        })
      );

      const { user } = setupWithoutDelay();

      const zipCodeInput = await findZipCodeInput();
      expect(zipCodeInput).toBeVisible();

      await user.type(
        zipCodeInput,
        mockMarketsAvailabilityZipCodeQuery.zipCode.toString()
      );

      const circularProgress = await screen.findByTestId(
        ADDRESS_TEST_IDS.MARKET_AVAILABILITY_CIRCULAR_PROGRESS
      );
      expect(circularProgress).toBeVisible();
    });

    it('should render success availability alert', async () => {
      const { user } = setupWithoutDelay();

      const zipCodeInput = await findZipCodeInput();
      expect(zipCodeInput).toBeVisible();

      await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

      const availabilityAlert = await screen.findByTestId(
        ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
      );
      expect(availabilityAlert).toBeVisible();
      expect(availabilityAlert).toHaveTextContent(
        'Great news! That location is in our service area'
      );
    });

    it('should render error availability alert', async () => {
      mswServer.use(
        rest.get(buildMarketsAvailabilityZipcodeApiPath(), (_req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ data: null }));
        })
      );

      const { user } = setupWithoutDelay();

      const zipCodeInput = await findZipCodeInput();
      expect(zipCodeInput).toBeVisible();

      await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

      const availabilityAlert = await screen.findByTestId(
        ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
      );
      expect(availabilityAlert).toBeVisible();
      expect(availabilityAlert).toHaveTextContent(
        'Sorry, we’re not available in your area yet.'
      );
      expect(availabilityAlert).toHaveTextContent(
        'We encourage you to call your primary care provider or seek care at a facility.'
      );
    });

    it('should render fully booked availability alert', async () => {
      mswServer.use(
        rest.post(buildCheckMarketFeasibilityApiPath(), (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              data: { availability: MarketFeasibilityStatus.Unavailable },
            })
          );
        })
      );

      const { user } = setupWithoutDelay();

      const zipCodeInput = await findZipCodeInput();
      expect(zipCodeInput).toBeVisible();

      await user.type(zipCodeInput, mockPatientAccountAddressData.zipCode);

      const availabilityAlert = await screen.findByTestId(
        ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
      );
      expect(availabilityAlert).toBeVisible();
      expect(availabilityAlert).toHaveTextContent(
        'Sorry, we’re fully booked in your location today and tomorrow.'
      );
      expect(availabilityAlert).toHaveTextContent(
        'We encourage you to call your primary care provider or seek care at a facility.'
      );
    });
  });
});
