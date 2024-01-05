import { screen } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Insurance,
  InsuranceFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import PatientInsurancesCard, {
  ADD_BUTTON_TEST_ID,
} from '../PatientInsurancesCard';

const mockedInsurance = InsuranceFromJSON(JSONMocks.insurance);

const setup = (insurances: Insurance[]) => {
  return renderWithClient(
    <PatientInsurancesCard patientId="1" insurances={insurances} />
  );
};

describe('PatientInsurancesCard', () => {
  it('renders the insurance data', () => {
    setup([mockedInsurance]);

    expect(screen.getByText('Primary insurance')).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Payer', mockedInsurance.name))
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Member ID', mockedInsurance.memberId)
      )
    ).toBeDefined();
    expect(screen.getByText('Add Secondary')).toBeDefined();
  });

  it("allows adding an insurance if there isn't any", () => {
    setup([]);

    expect(
      screen.getByText('There is no insurance information yet')
    ).toBeDefined();
    expect(screen.getByText('Add Primary Insurance')).toBeDefined();
  });

  it('allows adding a tertiary insurance if there are already 2 insurances', () => {
    setup([mockedInsurance, mockedInsurance]);

    expect(screen.getByText('Add Tertiary')).toBeDefined();
  });

  it('hides the add button if there are already 3 insurances', () => {
    setup([mockedInsurance, mockedInsurance, mockedInsurance]);

    expect(screen.queryByTestId(ADD_BUTTON_TEST_ID)).toBeNull();
  });
});
