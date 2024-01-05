import { screen } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Pharmacy,
  PharmacyFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import PatientPharmacyCard from '../PatientPharmacyCard';

const mockedPharmacy = PharmacyFromJSON(JSONMocks.pharmacy);

const setup = (patientId: string, pharmacy?: Pharmacy) => {
  return renderWithClient(
    <PatientPharmacyCard patientId={patientId} pharmacy={pharmacy} />
  );
};

describe('PatientPharmacyCard', () => {
  it('renders pharmacy data', () => {
    setup('1', mockedPharmacy);

    expect(
      screen.getByText(labelAndValueQueryMatcher('Name', mockedPharmacy.name))
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone Number', mockedPharmacy.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Fax Number', mockedPharmacy.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Address', mockedPharmacy.address)
      )
    ).toBeDefined();
  });

  it('renders a dash if any of the fields has no data', () => {
    setup('1', { id: '', name: '', patientId: '' });

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

  it('should render empty state when there are no pharmacies', async () => {
    setup('1');

    expect(
      await screen.findByText(
        'There are no pharmacies associated with this patient yet'
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('Add Pharmacy')).toBeInTheDocument();
  });
});
