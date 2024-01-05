import { render, screen } from '@testing-library/react';
import { updateMockedGates } from '@*company-data-covered*/caremanager/utils-mocks';
import Details from '../Details';

describe('<Details>', () => {
  it('renders page text', () => {
    render(
      <Details
        patient="Jane Cooper"
        id="1234"
        age={25}
        lengthOfStay={25}
        gender="F"
        serviceLine="Advanced Care"
        carePhase="Low Acuity"
        athenaMedicalRecordNumber="123456789"
        isWaiver={false}
      />
    );

    expect(screen.getByTestId('episode-details-section')).toBeInTheDocument();
  });

  describe('waiver chip', () => {
    it('should render', () => {
      updateMockedGates('care_manager_waiver_fe', true);

      render(
        <Details
          patient="Jane Cooper"
          id="1234"
          age={25}
          lengthOfStay={25}
          gender="F"
          serviceLine="Advanced Care"
          carePhase="Low Acuity"
          athenaMedicalRecordNumber="123456789"
          isWaiver
        />
      );
      expect(screen.getByText('Waiver')).toBeInTheDocument();
    });
  });
});
