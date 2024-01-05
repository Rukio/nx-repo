import { screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { PATIENT_DETAILS_HEADER_TEST_ID, PatientPage } from '../PatientPage';
import { PATIENT_DEMOGRAPHICS_CARD_TEST_ID } from '../components/PatientDemographicsCard/PatientDemographicsCard';
import { PATIENT_INSURANCES_CARD_TEST_ID } from '../components/PatientInsurancesCard/PatientInsurancesCard';
import { PATIENT_CONTACT_CARD_TEST_ID } from '../components/PatientContactCard/PatientContactCard';
import { PATIENT_MEDICAL_DECISION_MAKER_CARD_TEST_ID } from '../components/PatientMedicalDecisionMakerCard/PatientMedicalDecisionMakerCard';
import { PATIENT_PHARMACY_CARD_TEST_ID } from '../components/PatientPharmacyCard/PatientPharmacyCard';
import { PATIENT_EXTERNAL_CARE_TEAM_TEST_ID } from '../components/PatientExternalCareTeam/PatientExternalCareTeam';

const setup = () => {
  renderWithClient(
    <MemoryRouter initialEntries={['/patients/1']}>
      <Routes>
        <Route path="/patients/:id" element={<PatientPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Patient', () => {
  it('renders patient header with data and all the expected cards', async () => {
    setup();

    const header = await screen.findByTestId(PATIENT_DETAILS_HEADER_TEST_ID);

    expect(
      await within(header).findByText('Maria Martinez')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(PATIENT_DEMOGRAPHICS_CARD_TEST_ID)
    ).toBeDefined();
    expect(
      await screen.findByTestId(PATIENT_INSURANCES_CARD_TEST_ID)
    ).toBeDefined();
    expect(
      await screen.findByTestId(PATIENT_CONTACT_CARD_TEST_ID)
    ).toBeDefined();
    expect(
      await screen.findByTestId(PATIENT_MEDICAL_DECISION_MAKER_CARD_TEST_ID)
    ).toBeDefined();
    expect(
      await screen.findByTestId(PATIENT_PHARMACY_CARD_TEST_ID)
    ).toBeDefined();
    expect(
      await screen.findByTestId(PATIENT_EXTERNAL_CARE_TEAM_TEST_ID)
    ).toBeDefined();
  });
});
