import { render, screen, within } from '../../../testUtils';
import {
  getServiceLinesMock,
  getModalitiesMock,
} from '../../../testUtils/mocks';
import NetworksBillingCitiesStates, {
  NetworksBillingCitiesStatesProps,
} from './NetworksBillingCitiesStates';
import {
  NETWORKS_BILLING_CITIES_STATES_TEST_IDS,
  networksBillingCitiesStateModalityPrefix,
  networksBillingCitiesStatePrefixText,
} from './testIds';

const mockedNetworksBillingCitiesProps: NetworksBillingCitiesStatesProps = {
  states: [
    {
      id: '0',
      name: 'Awesome State',
      abbreviation: 'AWS',
      billingCities: [
        {
          id: '0',
          name: 'Awesome City',
          shortName: 'AC0',
        },
        {
          id: '1',
          name: 'Awesome City',
          shortName: 'AC1',
        },
      ],
    },
    {
      id: '12',
      name: 'New State',
      abbreviation: 'NS',
      billingCities: [
        {
          id: '100',
          name: 'New City',
          shortName: 'NC',
        },
      ],
    },
  ],
  selectedModalityIdsForBillingCity: {
    '0': { '0': ['0'] },
    '1': { '1': ['1'] },
    '2': { '2': ['0'] },
  },
  activeStatesIds: ['0', '1'],
  serviceLines: getServiceLinesMock(2),
  modalities: getModalitiesMock(),
  onChangeModality: vi.fn(),
  isDisabled: false,
};

const getStateCollapsedArrow = (stateId: string) =>
  screen.getByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateCollapsedArrowTestId(
      stateId
    )
  );

const getBillingCity = (stateId: string, billingCityId: string) =>
  screen.getByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getBillingCityTestId(
      stateId,
      billingCityId
    )
  );

const getModality = (
  stateId: string,
  billingCityId: string,
  serviceLineId: string,
  modalityId: string
) =>
  screen.getByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getModalityTestId(
      stateId,
      billingCityId,
      serviceLineId,
      modalityId
    )
  );
const getAllExistingModalities = () =>
  screen.getAllByTestId(
    new RegExp(
      `${networksBillingCitiesStatePrefixText}-${networksBillingCitiesStateModalityPrefix}`
    )
  );

const findServiceLineModalities = (
  stateId: string,
  billingCityId: string,
  serviceLineId: string
) => {
  const serviceLine = screen.getByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getServiceLineTestId(
      stateId,
      billingCityId,
      serviceLineId
    )
  );

  return within(serviceLine).findAllByTestId(
    new RegExp(
      NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getModalityTestId(
        stateId,
        billingCityId,
        serviceLineId,
        ''
      )
    )
  );
};
const findStateExpandedArrow = (stateId: string) =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateExpandedArrowTestId(stateId)
  );

const findState = (stateId: string) =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateTestId(stateId)
  );
const findStateActiveChip = (stateId: string) =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateActiveChip(stateId)
  );

const setup = (
  overrideProps: Partial<NetworksBillingCitiesStatesProps> = {}
) => {
  return render(
    <NetworksBillingCitiesStates
      {...mockedNetworksBillingCitiesProps}
      {...overrideProps}
    />
  );
};

describe('<NetworksBillingCitiesStates />', () => {
  it('should render states', () => {
    setup();

    expect(
      screen.getByTestId(NETWORKS_BILLING_CITIES_STATES_TEST_IDS.ROOT)
    ).toBeVisible();
  });

  it('should render state', async () => {
    setup();

    for (let i = 0; i < mockedNetworksBillingCitiesProps.states.length; i++) {
      const state = mockedNetworksBillingCitiesProps.states[i];

      const stateComponent = await findState(state.id);
      expect(stateComponent).toBeVisible();
    }
  });

  it('should render state status correctly (active/inactive)', async () => {
    setup();
    const unselectedState = await findStateActiveChip(
      mockedNetworksBillingCitiesProps.states[0].id
    );
    expect(unselectedState).toHaveTextContent('Active');

    const selectedState = await findStateActiveChip(
      mockedNetworksBillingCitiesProps.states[1].id
    );
    expect(selectedState).toHaveTextContent('Inactive');
  });

  it('should expand/collapse state', async () => {
    const { user } = setup();
    const stateId = mockedNetworksBillingCitiesProps.states[0].id;

    const stateComponent = await findState(stateId);

    const collapsedArrow = getStateCollapsedArrow(stateId);
    expect(collapsedArrow).toBeVisible();

    await user.click(stateComponent);

    const expandedArrow = await findStateExpandedArrow(stateId);
    expect(expandedArrow).toBeVisible();
  });

  it('should render billing cities', async () => {
    const { user } = setup();
    const state = mockedNetworksBillingCitiesProps.states[0];
    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    state.billingCities?.forEach((billingCity) => {
      const billingCityComponent = getBillingCity(state.id, billingCity.id);

      expect(billingCityComponent).toBeVisible();
    });
  });

  it('should render service lines', async () => {
    const { user } = setup();
    const state = mockedNetworksBillingCitiesProps.states[0];
    const billingCity = state.billingCities[0];
    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    const serviceLines = getServiceLinesMock(2);
    const billingCityComponent = getBillingCity(state.id, billingCity.id);
    serviceLines.forEach((serviceLine) => {
      const serviceLineComponent = within(billingCityComponent).getByTestId(
        NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getServiceLineTestId(
          state.id,
          billingCity.id,
          serviceLine.id
        )
      );

      expect(serviceLineComponent).toBeVisible();
    });
  });

  it('should render modalities', async () => {
    const { user } = setup();
    const state = mockedNetworksBillingCitiesProps.states[0];
    const billingCity = state.billingCities[0];
    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    const serviceLines = getServiceLinesMock(2);
    const modalities = getModalitiesMock();
    modalities.forEach((modality) => {
      const modalityComponent = getModality(
        state.id,
        billingCity.id,
        serviceLines[0].id,
        modality.id
      );

      expect(modalityComponent).toBeVisible();
    });
  });

  it('should call onChangeModality fn when user clicks on modality toggle', async () => {
    const { user } = setup();
    const state = mockedNetworksBillingCitiesProps.states[0];
    const billingCity = state.billingCities[0];
    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    const serviceLines = getServiceLinesMock(2);
    const modalities = getModalitiesMock();
    const modalityComponent = getModality(
      state.id,
      billingCity.id,
      serviceLines[0].id,
      modalities[0].id
    );

    const modalityToggle = within(modalityComponent).getByRole('checkbox');

    await user.click(modalityToggle);

    expect(mockedNetworksBillingCitiesProps.onChangeModality).toBeCalledWith(
      billingCity.id,
      serviceLines[0].id,
      modalities[0].id
    );
  });

  it('should render checked modality correctly for billing city', async () => {
    const state = mockedNetworksBillingCitiesProps.states[0];
    const billingCity = state.billingCities[0];
    const serviceLine = mockedNetworksBillingCitiesProps.serviceLines[0];

    const { user } = setup();

    const stateComponent = await findState(state.id);
    await user.click(stateComponent);
    const serviceLineModalityElements = await findServiceLineModalities(
      state.id,
      billingCity.id,
      serviceLine.id
    );
    expect(
      within(serviceLineModalityElements[0]).getByRole('checkbox')
    ).toBeChecked();
    expect(
      within(serviceLineModalityElements[1]).getByRole('checkbox')
    ).not.toBeChecked();
    expect(
      within(serviceLineModalityElements[2]).getByRole('checkbox')
    ).not.toBeChecked();
  });

  it('should not render checked modality for billing city if no configs for it provided', async () => {
    const state = mockedNetworksBillingCitiesProps.states[1];
    const billingCity = state.billingCities[0];
    const serviceLine = mockedNetworksBillingCitiesProps.serviceLines[0];

    const { user } = setup();

    const stateComponent = await findState(state.id);
    await user.click(stateComponent);
    const serviceLineModalityElements = await findServiceLineModalities(
      state.id,
      billingCity.id,
      serviceLine.id
    );
    expect(
      within(serviceLineModalityElements[0]).getByRole('checkbox')
    ).not.toBeChecked();
    expect(
      within(serviceLineModalityElements[1]).getByRole('checkbox')
    ).not.toBeChecked();
    expect(
      within(serviceLineModalityElements[2]).getByRole('checkbox')
    ).not.toBeChecked();
  });

  it('should render all modalities unchecked for all billing cities in state if no configs provided', async () => {
    const state = mockedNetworksBillingCitiesProps.states[0];

    const { user } = setup({ selectedModalityIdsForBillingCity: {} });

    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    const allModalities = getAllExistingModalities();

    for (const modalityElement of allModalities) {
      const checkboxElement = within(modalityElement).getByRole('checkbox');
      expect(checkboxElement).not.toBeChecked();
    }
  });

  it('should render disabled modalities toggles', async () => {
    const { user } = setup({ isDisabled: true });
    const state = mockedNetworksBillingCitiesProps.states[0];
    const billingCity = state.billingCities[0];
    const stateComponent = await findState(state.id);

    await user.click(stateComponent);

    const serviceLines = getServiceLinesMock(2);
    const modalities = getModalitiesMock();
    modalities.forEach((modality) => {
      const modalityComponent = getModality(
        state.id,
        billingCity.id,
        serviceLines[0].id,
        modality.id
      );

      expect(modalityComponent).toBeVisible();
      expect(modalityComponent).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
