import mapper from '../advanced-care.mapper';
import {
  MOCK_ADVANCED_CARE_PATIENT_DATA,
  MOCK_CM_ADVANCED_CARE_PATIENT_DATA,
} from './mocks/advanced-care.mock';

describe('Advanced Care mapper', () => {
  it('transform CM Advanced Care Patient into AOB Advanced Care Patient', async () => {
    const transformedResult = MOCK_CM_ADVANCED_CARE_PATIENT_DATA.map(
      mapper.mapCMAdvancedPatientToAdvancedPatient
    );
    expect(transformedResult).toEqual(MOCK_ADVANCED_CARE_PATIENT_DATA);
  });

  it('transform search query', async () => {
    const transformedResult = mapper.SearchActivePatientsQuery('4053');
    expect(transformedResult).toEqual({ athena_ids: '4053' });
  });
});
