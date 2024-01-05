import { screen } from '@testing-library/react';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  ExternalCareProvider,
  ExternalCareProviderFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import PatientExternalCareProviderCard from '../PatientExternalCareProviderCard';

const mockedECP = ExternalCareProviderFromJSON(JSONMocks.externalCareProvider);

const setup = (externalCareProvider: ExternalCareProvider) => {
  return renderWithClient(
    <PatientExternalCareProviderCard
      externalCareProvider={externalCareProvider}
    />
  );
};

describe('PatientExternalCareProviderCard', () => {
  it('renders pharmacy data', async () => {
    setup(mockedECP);

    expect(await screen.findByText('PCP')).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Name', mockedECP.name))
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone Number', mockedECP.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Fax Number', mockedECP.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Address', mockedECP.address))
    ).toBeDefined();
  });

  it('renders a dash if any of the fields has no data', () => {
    setup({ id: '', name: '', providerTypeId: '', patientId: '' });

    expect(
      screen.getByText(labelAndValueQueryMatcher('Name', '-'))
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Phone Number', '-'))
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Fax Number', '-'))
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Address', '-'))
    ).toBeDefined();
  });

  it('renders default provider name if provider type is not found', async () => {
    setup({ ...mockedECP, providerTypeId: '' });

    expect(await screen.findByText('Unknown Provider type')).toBeDefined();
  });
});
