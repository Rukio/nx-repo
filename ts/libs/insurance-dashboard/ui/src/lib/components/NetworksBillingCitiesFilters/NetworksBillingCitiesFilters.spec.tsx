import { render, screen, within, waitFor } from '../../../testUtils';
import NetworksBillingCitiesFilters, {
  NetworksBillingCitiesFiltersProps,
  normalizedStatesStatusOptions,
  StatesStatusOptions,
} from './NetworksBillingCitiesFilters';
import { NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS } from './testIds';

const mockedNetworksBillingCitiesProps: NetworksBillingCitiesFiltersProps = {
  states: [
    {
      id: '1',
      name: 'State 1',
      billingCities: [],
      abbreviation: 'S1',
    },
    {
      id: '2',
      name: 'State 2',
      billingCities: [],
      abbreviation: 'S2',
    },
  ],
  serviceLines: [
    {
      id: '1',
      name: 'Service Line 1',
      default: false,
    },
    {
      id: '2',
      name: 'Service Line 2',
      default: false,
    },
  ],
  onChangeFilterValue: vi.fn(),
  onResetFilterOptions: vi.fn(),
};

const getStatesSelect = () => {
  const containerComponent = screen.getByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT_CONTAINER
  );

  return within(containerComponent).getByRole('button', {
    ...screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT
    ),
    expanded: false,
  });
};
const getServiceLinesSelect = () => {
  const containerComponent = screen.getByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT_CONTAINER
  );

  return within(containerComponent).getByRole('button', {
    ...screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT
    ),
    expanded: false,
  });
};

const getStatesStatusSelect = () => {
  const containerComponent = screen.getByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_STATUS_SELECT_CONTAINER
  );

  return within(containerComponent).getByRole('button', {
    ...screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_STATUS_SELECT
    ),
    expanded: false,
  });
};

const findStatesSelectOption = async (optionId: string) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getStatesSelectOptionTestId(
      optionId
    )
  );
};

const findServiceLinesSelectOption = async (optionId: string) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getServiceLinesSelectOptionTestId(
      optionId
    )
  );
};

const findStatesStatusSelectOption = async (statesStatusName: string) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getStatesStatusSelectOptionTestId(
      statesStatusName
    )
  );
};

const setup = (
  overrideProps: Partial<NetworksBillingCitiesFiltersProps> = {}
) => {
  return render(
    <NetworksBillingCitiesFilters
      {...mockedNetworksBillingCitiesProps}
      {...overrideProps}
    />
  );
};

describe('<NetworksBillingCitiesFilters />', () => {
  it('should render states select', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();

    await user.click(statesSelect);
    for (const option of mockedNetworksBillingCitiesProps.states) {
      const stateOption = await findStatesSelectOption(option.id);
      expect(stateOption).toBeVisible();
      expect(stateOption).toHaveAttribute('data-value', String(option.id));
    }
  });

  it('should render service lines select', async () => {
    const { user } = setup();

    const serviceLinesSelect = getServiceLinesSelect();

    await user.click(serviceLinesSelect);
    for (const option of mockedNetworksBillingCitiesProps.serviceLines) {
      const serviceLineOption = await findServiceLinesSelectOption(option.id);
      expect(serviceLineOption).toBeVisible();
      expect(serviceLineOption).toHaveAttribute(
        'data-value',
        String(option.id)
      );
    }
  });

  it('should render states status select', async () => {
    const { user } = setup();

    const statesStatusSelect = getStatesStatusSelect();

    await user.click(statesStatusSelect);
    for (const statusOption of normalizedStatesStatusOptions) {
      const statesStatusOptionElement = await findStatesStatusSelectOption(
        statusOption.status
      );
      expect(statesStatusOptionElement).toBeVisible();
      expect(statesStatusOptionElement).toHaveAttribute(
        'data-value',
        String(statusOption.status)
      );
    }
  });

  it('should call onChangeFilterValue fn on state menu item click', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();

    await user.click(statesSelect);
    const stateOption = await findStatesSelectOption(
      mockedNetworksBillingCitiesProps.states[0].id
    );
    await user.click(stateOption);
    await waitFor(() =>
      expect(
        mockedNetworksBillingCitiesProps.onChangeFilterValue
      ).toHaveBeenLastCalledWith(
        'stateId',
        mockedNetworksBillingCitiesProps.states[0].id
      )
    );
  });

  it('should select service lines', async () => {
    const { user } = setup();

    const serviceLinesSelect = getServiceLinesSelect();

    await user.click(serviceLinesSelect);
    const serviceLineOption = await findServiceLinesSelectOption(
      mockedNetworksBillingCitiesProps.serviceLines[0].id
    );
    await user.click(serviceLineOption);
    await waitFor(() =>
      expect(
        mockedNetworksBillingCitiesProps.onChangeFilterValue
      ).toHaveBeenLastCalledWith(
        'serviceLineId',
        mockedNetworksBillingCitiesProps.serviceLines[0].id
      )
    );
  });

  it('should render Reset Filters button if any filter option is selected', () => {
    setup({ stateId: mockedNetworksBillingCitiesProps.states[0].id });

    const resetFiltersButton = screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.RESET_FILTERS_BUTTON
    );
    expect(resetFiltersButton).toBeVisible();
  });

  it('should call onResetFilterOptions on Reset Filters button click', async () => {
    const { user } = setup({
      stateId: mockedNetworksBillingCitiesProps.states[0].id,
    });

    const resetFiltersButton = screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.RESET_FILTERS_BUTTON
    );

    await user.click(resetFiltersButton);
    expect(
      mockedNetworksBillingCitiesProps.onResetFilterOptions
    ).toHaveBeenCalled();
  });

  it('should select states status options', async () => {
    const { user } = setup();

    const statesStatusSelect = getStatesStatusSelect();

    await user.click(statesStatusSelect);
    const statesStatusOption = await findStatesStatusSelectOption(
      StatesStatusOptions.ACTIVE
    );
    await user.click(statesStatusOption);
    await waitFor(() =>
      expect(
        mockedNetworksBillingCitiesProps.onChangeFilterValue
      ).toHaveBeenLastCalledWith(
        'statesStatusOption',
        StatesStatusOptions.ACTIVE
      )
    );
  });
});
