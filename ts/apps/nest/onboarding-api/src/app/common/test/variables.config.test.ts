import VariablesConfigText from '../variables.config';

describe('Configuration variables', () => {
  it('should return correct variables', () => {
    expect(VariablesConfigText.PatientsTokenKey).toEqual('PATIENT_SERVICE');
    expect(VariablesConfigText.PatientsAudienceKey).toEqual(
      'M2M_PATIENT_SERVICE_AUDIENCE'
    );
  });
});
