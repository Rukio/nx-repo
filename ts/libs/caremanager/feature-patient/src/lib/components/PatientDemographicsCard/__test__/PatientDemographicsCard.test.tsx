import { screen } from '@testing-library/react';
import { format, subDays, subYears } from 'date-fns';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Patient,
  PatientFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import PatientDemographicsCard from '../PatientDemographicsCard';

const mockedPatientAge = 30;
const mockedDateOfBirth = subYears(subDays(new Date(), 1), mockedPatientAge);
const mockedDOBAPIFormatted = format(mockedDateOfBirth, 'yyyy-MM-dd');
const mockedDOBFormatted = format(mockedDateOfBirth, 'MM/dd/yyyy');
const mockedPatient: Patient = {
  ...PatientFromJSON(JSONMocks.createdPatient),
  dateOfBirth: mockedDOBAPIFormatted,
};

const setup = (patient: Patient) => {
  return renderWithClient(<PatientDemographicsCard patient={patient} />);
};

describe('PatientDemographicsCard', () => {
  it('renders demographics data', () => {
    setup(mockedPatient);

    expect(
      screen.getByText(
        labelAndValueQueryMatcher('First Name', mockedPatient.firstName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Middle Name', mockedPatient.middleName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Last Name', mockedPatient.lastName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'Date of Birth',
          `${mockedDOBFormatted} (${mockedPatientAge}yo)`
        )
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('MRN/Athena ID', mockedPatient.athenaId)
      )
    ).toBeDefined();
  });

  it('renders a dash for fields without data', () => {
    setup({ ...mockedPatient, athenaId: undefined });

    expect(
      screen.getByText(labelAndValueQueryMatcher('MRN/Athena ID', '-'))
    ).toBeDefined();
  });
});
