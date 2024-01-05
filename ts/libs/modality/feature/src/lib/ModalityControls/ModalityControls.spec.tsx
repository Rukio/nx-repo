import {
  RootState,
  INSURANCES_CONFIGURATION_KEY,
  MARKETS_CONFIGURATION_KEY,
  initialInsurancesConfigurationState,
  initialMarketsConfigurationState,
  transformDomainMarket,
  transformDomainServiceLine,
  transformDomainModality,
  transformDomainInsurancePlan,
  updateMarketModalityConfig,
  updateModalityConfig,
  selectMarketsModalityConfigs,
  selectModalityConfigs,
} from '@*company-data-covered*/modality/data-access';
import {
  mockedMarket as domainMockedMarket,
  mockedServiceLine as domainMockedServiceLine,
  mockedModality as domainMockedModality,
  mockedInsurancePlan as domainMockedInsurancePlan,
} from '@*company-data-covered*/station/data-access';
import { MODALITY_CONTROLS_TEST_IDS as MODALITY_CONTROLS_TEST_IDS_UI } from '@*company-data-covered*/modality/ui';
import { MODALITY_CONTROLS_TEST_IDS } from './testIds';

import ModalityControls from './ModalityControls';
import { render, waitFor, screen, act } from '../testUtils';

const mockedMarket = transformDomainMarket(domainMockedMarket);
const mockedServiceLine = transformDomainServiceLine(domainMockedServiceLine);
const mockedModality = transformDomainModality(domainMockedModality);
const mockedInsurancePlan = transformDomainInsurancePlan(
  domainMockedInsurancePlan
);
const mockedMarketModalityConfig = {
  marketId: mockedMarket.id,
  serviceLineId: mockedServiceLine.id,
  modalityId: mockedModality.id,
};

const mockedModalityConfig = {
  marketId: mockedMarket.id,
  serviceLineId: mockedServiceLine.id,
  modalityId: mockedModality.id,
  insurancePlanId: mockedInsurancePlan.id,
};

const setup = (preselectedState?: Partial<RootState>) => {
  const getSubmitButton = () =>
    screen.getByTestId(MODALITY_CONTROLS_TEST_IDS_UI.SUBMIT_BUTTON);
  const getCancelButton = () =>
    screen.getByTestId(MODALITY_CONTROLS_TEST_IDS_UI.CANCEL_BUTTON);
  const findNotificationMessage = () =>
    screen.findByTestId(MODALITY_CONTROLS_TEST_IDS.NOTIFICATION_MESSAGE);

  return {
    ...render(<ModalityControls />, preselectedState),
    getSubmitButton,
    getCancelButton,
    findNotificationMessage,
  };
};

describe('<ModalityControls />', () => {
  it('should reset all modality configuration changes', async () => {
    const { store, user, getCancelButton } = setup({
      [INSURANCES_CONFIGURATION_KEY]: {
        ...initialInsurancesConfigurationState,
        selectedMarket: mockedMarket,
      },
      [MARKETS_CONFIGURATION_KEY]: {
        ...initialMarketsConfigurationState,
        selectedServiceLine: mockedServiceLine,
      },
    });

    act(() => {
      const initialModalityConfigs = selectModalityConfigs(store.getState());
      const initialMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );

      expect(initialModalityConfigs).toBeUndefined();
      expect(initialMarketsModalityConfigs).toBeUndefined();

      store.dispatch(updateMarketModalityConfig(mockedMarketModalityConfig));

      store.dispatch(updateModalityConfig(mockedModalityConfig));

      const updatedModalityConfigs = selectModalityConfigs(store.getState());
      const updatedMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );

      expect(updatedModalityConfigs).toEqual([mockedModalityConfig]);

      expect(updatedMarketsModalityConfigs).toEqual([
        mockedMarketModalityConfig,
      ]);
    });

    const cancelButton = getCancelButton();

    await user.click(cancelButton);

    act(() => {
      const resetModalityConfigs = selectModalityConfigs(store.getState());
      const resetMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );

      expect(resetModalityConfigs).toEqual([]);
      expect(resetMarketsModalityConfigs).toEqual([]);
    });
  });

  it('should submit saving modalities and show loading state', async () => {
    const { user, store, getSubmitButton, findNotificationMessage } = setup({
      [INSURANCES_CONFIGURATION_KEY]: {
        ...initialInsurancesConfigurationState,
        selectedMarket: mockedMarket,
      },
      [MARKETS_CONFIGURATION_KEY]: {
        ...initialMarketsConfigurationState,
        selectedServiceLine: mockedServiceLine,
      },
    });

    act(() => {
      store.dispatch(updateMarketModalityConfig(mockedMarketModalityConfig));
      store.dispatch(updateModalityConfig(mockedModalityConfig));
    });

    const submitButton = getSubmitButton();

    expect(submitButton).toHaveProperty('disabled', false);

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toHaveProperty('disabled', true);
    });

    await waitFor(() => {
      expect(submitButton).toHaveProperty('disabled', false);
    });

    const notificationMessage = await findNotificationMessage();
    expect(notificationMessage).toHaveTextContent('Note saved');
  });

  it('should not submit saving modalities is service line not selected', async () => {
    const { user, getSubmitButton } = setup({
      [INSURANCES_CONFIGURATION_KEY]: {
        ...initialInsurancesConfigurationState,
        selectedMarket: mockedMarket,
      },
    });

    const submitButton = getSubmitButton();

    expect(submitButton).toHaveProperty('disabled', false);

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).not.toHaveProperty('disabled', true);
    });
  });
});
