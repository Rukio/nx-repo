import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Patient } from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import PatientCell from '../PatientCell';

const setup = () => {
  const tenYearsAgo = new Date(Date.now() - 10 * 365.5 * 86400000);
  const patient = {} as Patient;
  patient.id = '0';
  patient.firstName = 'Name';
  patient.middleName = 'MiddleName';
  patient.lastName = 'LastName';
  patient.sex = 'female';
  patient.dateOfBirth = tenYearsAgo.toString();
  patient.phoneNumber = '555';
  patient.addressStreet = 'Street 123';
  patient.addressCity = 'Denver';
  patient.addressState = 'CO';
  patient.addressZipcode = '01234';
  renderWithClient(
    <BrowserRouter>
      <PatientCell episodeId="1" patient={patient} containerStyles={{}} />
    </BrowserRouter>
  );
};

describe('patient details cell', () => {
  it('age and sex are correct', () => {
    setup();
    const ageAndSex = screen.getByText(/\d+yo/);
    expect(ageAndSex).toHaveTextContent('10yo F');
  });
});
