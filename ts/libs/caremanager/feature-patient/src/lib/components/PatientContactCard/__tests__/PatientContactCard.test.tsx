import { screen } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Patient,
  PatientFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import PatientContactCard from '../PatientContactCard';

const mockedPatient = PatientFromJSON(JSONMocks.createdPatient);

const setup = (patient: Patient) => {
  return renderWithClient(<PatientContactCard patient={patient} />);
};

describe('PatientContactCard', () => {
  it('renders contact data', () => {
    setup(mockedPatient);

    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'Address',
          '2543 S Toledo Way Denver, CO 80205'
        )
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone Number', mockedPatient.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Note', mockedPatient.addressNotes)
      )
    ).toBeDefined();
  });
});
