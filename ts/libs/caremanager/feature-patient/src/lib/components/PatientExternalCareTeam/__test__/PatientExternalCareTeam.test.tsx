import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  ExternalCareProvider,
  ExternalCareProviderFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import PatientExternalCareTeam from '../PatientExternalCareTeam';
import { EXTERNAL_CARE_PROVIDER_CARD_TEST_ID } from '../../PatientExternalCareProviderCard/PatientExternalCareProviderCard';

const mockedECP = ExternalCareProviderFromJSON(JSONMocks.externalCareProvider);

const setup = (externalCareProviders: ExternalCareProvider[]) => {
  return renderWithClient(
    <PatientExternalCareTeam
      patientId="1"
      externalCareProviders={externalCareProviders}
    />
  );
};

describe('PatientExternalCareTeam', () => {
  it('renders the correct amount of care providers', () => {
    setup([mockedECP, { ...mockedECP, id: '2' }]);

    expect(
      screen.getByTestId(`${EXTERNAL_CARE_PROVIDER_CARD_TEST_ID}-123`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${EXTERNAL_CARE_PROVIDER_CARD_TEST_ID}-2`)
    ).toBeInTheDocument();
  });

  it('renders an empty state if there are no care providers', () => {
    setup([]);

    expect(
      screen.queryAllByTestId(EXTERNAL_CARE_PROVIDER_CARD_TEST_ID, {
        exact: false,
      })
    ).toHaveLength(0);
    expect(
      screen.getByText('No one has been added to the External Care Team yet')
    ).toBeDefined();
  });
});
